import mongoose from 'mongoose';
import { Conversation, ChatMessage, User, Employee, Department } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getSocketIO, isUserOnline } from '../services/socketService.js';

export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const conversations = await Conversation.find({
    participants: userId,
  })
    .sort({ updatedAt: -1 })
    .populate({
      path: 'participants',
      select: 'username role firstName lastName employeeId internId',
      populate: [
        {
          path: 'employeeId',
          select: 'firstName lastName nickname position profileImage departmentId employeeCode',
          populate: { path: 'departmentId', select: 'name code' },
        },
        {
          path: 'internId',
          select: 'firstName lastName nickname university departmentId',
          populate: { path: 'departmentId', select: 'name code' },
        },
      ],
    })
    .lean();

  const formatted = conversations.map((conv) => {
    // Find the other participant in a direct conversation
    const otherParticipant = conv.participants.find(
      (p) => p._id.toString() !== userId
    );

    const unreadCount = conv.unreadCounts ? Number(conv.unreadCounts[userId] || 0) : 0;

    return {
      ...conv,
      department: conv.supportDepartment || conv.department || null,
      supportDepartment: conv.supportDepartment || null,
      otherParticipant: otherParticipant
        ? {
            ...otherParticipant,
            isOnline: isUserOnline(otherParticipant._id),
          }
        : null,
      unreadCount,
    };
  });

  res.status(200).json({ success: true, data: formatted });
});

export const getOrCreateDirectConversation = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { recipientId } = req.body;

  if (!recipientId) {
    throw ApiError.badRequest('Recipient ID is required');
  }

  if (currentUserId === recipientId) {
    throw ApiError.badRequest('Cannot start conversation with yourself');
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw ApiError.notFound('Recipient user not found');
  }

  // Check if a direct conversation already exists
  let conversation = await Conversation.findOne({
    type: 'direct',
    participants: { $all: [currentUserId, recipientId], $size: 2 },
  })
    .populate({
      path: 'participants',
      select: 'username role firstName lastName employeeId internId',
      populate: [
        {
          path: 'employeeId',
          select: 'firstName lastName nickname position profileImage departmentId',
          populate: { path: 'departmentId', select: 'name code' },
        },
        {
          path: 'internId',
          select: 'firstName lastName nickname departmentId',
          populate: { path: 'departmentId', select: 'name code' },
        },
      ],
    });

  if (!conversation) {
    conversation = await Conversation.create({
      type: 'direct',
      participants: [currentUserId, recipientId],
      unreadCounts: {
        [currentUserId]: 0,
        [recipientId]: 0,
      },
    });

    conversation = await Conversation.findById(conversation._id).populate({
      path: 'participants',
      select: 'username role firstName lastName employeeId internId',
      populate: [
        {
          path: 'employeeId',
          select: 'firstName lastName nickname position profileImage departmentId',
          populate: { path: 'departmentId', select: 'name code' },
        },
        {
          path: 'internId',
          select: 'firstName lastName nickname departmentId',
          populate: { path: 'departmentId', select: 'name code' },
        },
      ],
    });
  }

  const otherParticipant = conversation.participants.find(
    (p) => p._id.toString() !== currentUserId
  );

  res.status(200).json({
    success: true,
    data: {
      ...conversation.toObject(),
      otherParticipant: otherParticipant
        ? {
            ...otherParticipant.toObject(),
            isOnline: isUserOnline(otherParticipant._id),
          }
        : null,
      unreadCount: Number(conversation.unreadCounts?.[currentUserId] || 0),
    },
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const currentUserId = req.user.id;
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const conv = await Conversation.findById(conversationId);
  if (!conv) {
    throw ApiError.notFound('Conversation not found');
  }

  const isParticipant = conv.participants.some(
    (p) => p.toString() === currentUserId
  );
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }

  const query = { conversationId };
  if (req.query.before) {
    query.createdAt = { $lt: new Date(req.query.before) };
  }

  const messages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({
      path: 'senderId',
      select: 'username role firstName lastName employeeId internId',
      populate: [
        { path: 'employeeId', select: 'firstName lastName nickname position profileImage' },
        { path: 'internId', select: 'firstName lastName nickname' },
      ],
    })
    .lean();

  // Return in chronological order
  res.status(200).json({
    success: true,
    data: messages.reverse(),
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const currentUserId = req.user.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw ApiError.badRequest('Message content is required');
  }

  const conv = await Conversation.findById(conversationId);
  if (!conv) {
    throw ApiError.notFound('Conversation not found');
  }

  const isParticipant = conv.participants.some(
    (p) => p.toString() === currentUserId
  );
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }

  const message = await ChatMessage.create({
    conversationId,
    senderId: currentUserId,
    content: content.trim(),
    readBy: [currentUserId],
  });

  // Update conversation
  conv.lastMessage = {
    text: content.trim(),
    senderId: currentUserId,
    createdAt: message.createdAt,
  };

  conv.participants.forEach((p) => {
    const pStr = p.toString();
    if (pStr !== currentUserId) {
      const current = conv.unreadCounts.get(pStr) || 0;
      conv.unreadCounts.set(pStr, current + 1);
    }
  });
  await conv.save();

  const populated = await ChatMessage.findById(message._id)
    .populate({
      path: 'senderId',
      select: 'username role firstName lastName employeeId internId',
      populate: [
        { path: 'employeeId', select: 'firstName lastName nickname position profileImage' },
        { path: 'internId', select: 'firstName lastName nickname' },
      ],
    })
    .lean();

  const io = getSocketIO();
  if (io) {
    io.to(`conv_${conversationId}`).emit('message:new', populated);
    conv.participants.forEach((p) => {
      const pStr = p.toString();
      io.to(`user_${pStr}`).emit('conversation:updated', {
        conversationId: conv._id,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCounts.get(pStr) || 0,
      });
    });
  }

  res.status(201).json({ success: true, data: populated });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const currentUserId = req.user.id;

  const conv = await Conversation.findById(conversationId);
  if (!conv) {
    throw ApiError.notFound('Conversation not found');
  }

  await ChatMessage.updateMany(
    { conversationId, readBy: { $ne: currentUserId } },
    { $addToSet: { readBy: currentUserId } }
  );

  conv.unreadCounts.set(currentUserId, 0);
  await conv.save();

  const io = getSocketIO();
  if (io) {
    io.to(`conv_${conversationId}`).emit('message:read_receipt', {
      conversationId,
      readByUserId: currentUserId,
    });
    io.to(`user_${currentUserId}`).emit('conversation:updated', {
      conversationId,
      unreadCount: 0,
    });
  }

  res.status(200).json({ success: true, message: 'Messages marked as read' });
});

export const searchColleagues = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const q = (req.query.q || '').trim();

  // Find all active users except current user
  const users = await User.find({
    _id: { $ne: currentUserId },
    isActive: true,
  })
    .select('_id username role firstName lastName email employeeId internId')
    .populate({
      path: 'employeeId',
      select: 'firstName lastName nickname position departmentId profileImage employeeCode',
      populate: { path: 'departmentId', select: 'name code' },
    })
    .populate({
      path: 'internId',
      select: 'firstName lastName nickname university departmentId',
      populate: { path: 'departmentId', select: 'name code' },
    })
    .limit(50)
    .lean();

  // Filter in-memory if query provided
  let filtered = users;
  if (q) {
    const term = q.toLowerCase();
    filtered = users.filter((u) => {
      const emp = u.employeeId;
      const intern = u.internId;
      const names = [
        u.username,
        u.email,
        u.firstName,
        u.lastName,
        emp?.firstName,
        emp?.lastName,
        emp?.nickname,
        emp?.position,
        emp?.employeeCode,
        emp?.departmentId?.name,
        intern?.firstName,
        intern?.lastName,
        intern?.nickname,
        intern?.university,
      ].filter(Boolean);

      return names.some((val) => val.toLowerCase().includes(term));
    });
  }

  const result = filtered.map((u) => ({
    _id: u._id,
    username: u.username,
    role: u.role,
    name:
      [u.employeeId?.firstName || u.internId?.firstName || u.firstName,
       u.employeeId?.lastName || u.internId?.lastName || u.lastName]
        .filter(Boolean)
        .join(' ') || u.username,
    nickname: u.employeeId?.nickname || u.internId?.nickname || '',
    position: u.employeeId?.position || (u.internId ? 'Intern' : u.role),
    department: u.employeeId?.departmentId?.name || u.internId?.departmentId?.name || '',
    profileImage: u.employeeId?.profileImage || '',
    isOnline: isUserOnline(u._id),
  }));

  res.status(200).json({ success: true, data: result });
});

export const getOrCreateSupportConversation = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const departmentType = req.params.department; // 'it' or 'hr'

  if (!['it', 'hr'].includes(departmentType)) {
    throw ApiError.badRequest('Invalid support department');
  }

  const title = departmentType === 'it' ? 'ศูนย์ช่วยเหลือไอที (IT Support)' : 'ฝ่ายทรัพยากรบุคคล (HR Support)';

  // Find admins or staff to include in support
  const staffMembers = await User.find({
    role: { $in: ['admin', 'super_admin', 'editor'] },
    isActive: true,
  }).select('_id');

  const staffIds = staffMembers.map((s) => s._id.toString());
  const allParticipants = Array.from(new Set([currentUserId, ...staffIds]));

  // Check if a canonical support conversation already exists for this department
  let conversation = await Conversation.findOne({
    type: 'support',
    supportDepartment: departmentType,
  }).populate({
    path: 'participants',
    select: 'username role firstName lastName employeeId internId',
  });

  if (!conversation) {
    const unreadCounts = new Map();
    allParticipants.forEach((id) => {
      unreadCounts.set(id, 0);
    });

    conversation = await Conversation.create({
      type: 'support',
      supportDepartment: departmentType,
      title,
      participants: allParticipants,
      unreadCounts,
    });
  } else {
    // Ensure current user is in participants list
    const hasCurrentUser = conversation.participants.some(
      (p) => (p._id?.toString() || p.toString()) === currentUserId
    );
    if (!hasCurrentUser) {
      conversation.participants.push(currentUserId);
      if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
      conversation.unreadCounts.set(currentUserId, 0);
      await conversation.save();
    }
  }

  res.status(200).json({ success: true, data: conversation });
});
