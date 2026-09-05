import { KnowledgeArticle, AuditLog } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadImage, deleteImage } from '../utils/imageUpload.js';

const MAX_ARTICLE_IMAGES = 5;

export const addArticleImage = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findById(req.params.id);
  if (!article) throw ApiError.notFound('Knowledge article not found');

  if (article.images && article.images.length >= MAX_ARTICLE_IMAGES) {
    throw ApiError.badRequest(`Maximum ${MAX_ARTICLE_IMAGES} images allowed per article`);
  }

  if (!req.file) {
    throw ApiError.badRequest('Image file is required');
  }

  const uploaded = await uploadImage(req.file.buffer, 'fti-welcome-hub/knowledge', { maxWidth: 1200 });

  const newImage = {
    url: uploaded.url,
    publicId: uploaded.publicId,
    caption: (req.body.caption || '').trim().slice(0, 200),
    sortOrder: article.images ? article.images.length : 0,
  };

  article.images.push(newImage);
  await article.save();

  await AuditLog.record({
    userId: req.user.id,
    action: 'update',
    entity: 'KnowledgeArticle',
    entityId: article._id,
    after: { addedImage: newImage },
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(201).json({
    success: true,
    data: {
      image: article.images[article.images.length - 1],
      images: article.images,
    },
  });
});

export const removeArticleImage = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findById(req.params.id);
  if (!article) throw ApiError.notFound('Knowledge article not found');

  const image = article.images.id(req.params.imgId);
  if (!image) throw ApiError.notFound('Image not found');

  const publicId = image.publicId;
  image.deleteOne();
  await article.save();

  if (publicId) {
    await deleteImage(publicId);
  }

  await AuditLog.record({
    userId: req.user.id,
    action: 'update',
    entity: 'KnowledgeArticle',
    entityId: article._id,
    after: { removedImageId: req.params.imgId },
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(200).json({
    success: true,
    message: 'Image removed successfully',
    data: { images: article.images },
  });
});

export const reorderArticleImages = asyncHandler(async (req, res) => {
  const { imageIds } = req.body;
  if (!Array.isArray(imageIds)) {
    throw ApiError.badRequest('imageIds must be an array of image IDs');
  }

  const article = await KnowledgeArticle.findById(req.params.id);
  if (!article) throw ApiError.notFound('Knowledge article not found');

  const idOrderMap = new Map(imageIds.map((id, index) => [id.toString(), index]));
  article.images.forEach((img) => {
    const order = idOrderMap.get(img._id.toString());
    if (order !== undefined) {
      img.sortOrder = order;
    }
  });

  article.images.sort((a, b) => a.sortOrder - b.sortOrder);
  await article.save();

  res.status(200).json({
    success: true,
    data: { images: article.images },
  });
});
