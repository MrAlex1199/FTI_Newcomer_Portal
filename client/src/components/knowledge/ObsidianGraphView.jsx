import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import useLanguage from '../../hooks/useLanguage.js';

/**
 * Domain Spectrum Configurations
 * Divides the 360-degree knowledge graph into 4 orbital quadrants / sectors
 */
const DOMAINS = {
  software: {
    key: 'software',
    labelTh: 'ระบบปฏิบัติการและซอฟต์แวร์',
    labelEn: 'OS & Software',
    baseAngle: 0, // 0 rad (East / 3 o'clock)
    color: '#0284c7', // Sky 600
    accentColor: '#38bdf8', // Sky 400
    haloColor: 'rgba(56, 189, 248, 0.28)',
    keywords: ['software', 'ซอฟต์แวร์', 'os', 'windows', 'linux', 'ubuntu', 'word', 'excel', 'microsoft', 'erp', 'office', 'teams'],
  },
  hardware: {
    key: 'hardware',
    labelTh: 'ฮาร์ดแวร์และอุปกรณ์ไอที',
    labelEn: 'Hardware & Devices',
    baseAngle: Math.PI * 0.5, // 90 deg (South / 6 o'clock)
    color: '#ea580c', // Orange 600
    accentColor: '#fb923c', // Orange 400
    haloColor: 'rgba(249, 115, 22, 0.28)',
    keywords: ['hardware', 'ฮาร์ดแวร์', 'cpu', 'ram', 'storage', 'ssd', 'printer', 'พิมพ์', 'monitor', 'จอ', 'cctv', 'กล้อง', 'ptz', 'pdpa'],
  },
  network: {
    key: 'network',
    labelTh: 'ระบบเครือข่ายและการเชื่อมต่อ',
    labelEn: 'Network & Connectivity',
    baseAngle: Math.PI, // 180 deg (West / 9 o'clock)
    color: '#059669', // Emerald 600
    accentColor: '#34d399', // Emerald 400
    haloColor: 'rgba(16, 185, 129, 0.28)',
    keywords: ['network', 'เครือข่าย', 'wifi', 'wi-fi', 'vpn', 'diagnostics', 'lan', 'internet', 'ping', 'dns'],
  },
  security: {
    key: 'security',
    labelTh: 'ความปลอดภัยและนโยบายไอที',
    labelEn: 'Security & Policy',
    baseAngle: Math.PI * 1.5, // 270 deg (North / 12 o'clock)
    color: '#9333ea', // Purple 600
    accentColor: '#c084fc', // Purple 400
    haloColor: 'rgba(168, 85, 247, 0.28)',
    keywords: ['security', 'ปลอดภัย', 'password', 'รหัสผ่าน', '2fa', 'mfa', 'phishing', 'sla', 'loan', 'policy', 'นโยบาย', 'ยืม-คืน'],
  },
};

/**
 * Detect domain from topic and its hierarchy chain
 */
function detectDomain(topic, allTopicsMap) {
  let current = topic;
  const visited = new Set();
  while (current && !visited.has(String(current._id))) {
    visited.add(String(current._id));
    const parentId = current.parentId
      ? (typeof current.parentId === 'object' && current.parentId._id ? String(current.parentId._id) : String(current.parentId))
      : null;
    if (!parentId) break;
    const parent = allTopicsMap.get(parentId);
    if (!parent) break;
    current = parent;
  }

  const textToMatch = `${current.name || ''} ${current.nameEn || ''} ${current.slug || ''}`.toLowerCase();
  for (const [key, domain] of Object.entries(DOMAINS)) {
    if (domain.keywords.some((kw) => textToMatch.includes(kw))) {
      return key;
    }
  }
  return 'software';
}

/**
 * ObsidianGraphView - Interactive 2D Knowledge Graph
 * 
 * Features:
 * - Planetary Orbit System (Central Sun, 4 Domain Sectors, Radial Halo Density Nebulae)
 * - Free-Floating Physics toggle
 * - Dynamic Node Scaling & Article Count Badges
 * - Canvas 2D Force-Directed Simulation
 * - Pan, Zoom, Drag, Quick Preview Card & Filters
 */
export default function ObsidianGraphView({
  topics = [],
  articles = [],
  onOpenArticle,
  initialSelectedArticleId = null,
}) {
  const { t, language } = useLanguage();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Layout & UI states
  const [layoutMode, setLayoutMode] = useState('planetary'); // 'planetary' | 'free'
  const [theme, setTheme] = useState('dark'); // 'dark' (Obsidian) | 'light'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolders, setShowFolders] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Camera & Physics state references
  const cameraRef = useRef({ x: 0, y: 0, zoom: 0.85 });
  const isDraggingRef = useRef(false);
  const dragTargetRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);

  // Simulation alpha/energy
  const alphaRef = useRef(1);

  // 1. Transform raw topics & articles into Graph Nodes & Links with Domain Intelligence
  const graphData = useMemo(() => {
    const nodeMap = new Map();
    const links = [];

    // Fast lookup for topics
    const topicLookup = new Map();
    topics.forEach((topic) => topicLookup.set(String(topic._id), topic));

    // Articles grouped by topic
    const articlesByTopic = new Map();
    articles.forEach((art) => {
      const topicId = art.topicId?._id ? String(art.topicId._id) : (art.topicId ? String(art.topicId) : null);
      if (topicId) {
        if (!articlesByTopic.has(topicId)) articlesByTopic.set(topicId, []);
        articlesByTopic.get(topicId).push(art);
      }
    });

    // Domain Statistics & Density Tracking
    const domainStats = {
      software: { articleCount: 0, topicCount: 0 },
      hardware: { articleCount: 0, topicCount: 0 },
      network: { articleCount: 0, topicCount: 0 },
      security: { articleCount: 0, topicCount: 0 },
    };

    // Calculate article counts per topic (including descendants)
    const topicSubtreeArticleCount = new Map();
    topics.forEach((t) => {
      const direct = (articlesByTopic.get(String(t._id)) || []).length;
      topicSubtreeArticleCount.set(String(t._id), direct);
    });

    topics.forEach((t) => {
      let curParentId = t.parentId
        ? (typeof t.parentId === 'object' && t.parentId._id ? String(t.parentId._id) : String(t.parentId))
        : null;
      const direct = (articlesByTopic.get(String(t._id)) || []).length;
      const visited = new Set();
      while (curParentId && !visited.has(curParentId)) {
        visited.add(curParentId);
        const prev = topicSubtreeArticleCount.get(curParentId) || 0;
        topicSubtreeArticleCount.set(curParentId, prev + direct);
        const pTopic = topicLookup.get(curParentId);
        curParentId = pTopic?.parentId
          ? (typeof pTopic.parentId === 'object' && pTopic.parentId._id ? String(pTopic.parentId._id) : String(pTopic.parentId))
          : null;
      }
    });

    // Populate Domain Stats
    topics.forEach((t) => {
      const dKey = detectDomain(t, topicLookup);
      if (domainStats[dKey]) {
        domainStats[dKey].topicCount += 1;
        const direct = (articlesByTopic.get(String(t._id)) || []).length;
        domainStats[dKey].articleCount += direct;
      }
    });

    // A. Central Sun Node (Knowledge Core)
    const coreId = 'core_fti_vault';
    nodeMap.set(coreId, {
      id: coreId,
      rawId: 'core',
      type: 'core',
      label: language === 'th' ? 'ศูนย์กลางคลังความรู้ FTI IT' : 'FTI IT Knowledge Core',
      icon: '🪐',
      color: '#f59e0b',
      accentColor: '#fbbf24',
      radius: 26,
      targetRadius: 0,
      targetAngle: 0,
      domain: 'core',
      articleCount: articles.length,
      domainStats,
    });

    // Determine topic hierarchy depth & group child topics for angular distribution
    const rootTopics = [];
    const childrenByParent = new Map();

    topics.forEach((t) => {
      const parentRawId = t.parentId
        ? (typeof t.parentId === 'object' && t.parentId._id ? String(t.parentId._id) : String(t.parentId))
        : null;
      if (!parentRawId) {
        rootTopics.push(t);
      } else {
        if (!childrenByParent.has(parentRawId)) childrenByParent.set(parentRawId, []);
        childrenByParent.get(parentRawId).push(t);
      }
    });

    // B. Add Topic (Folder) Nodes with Planetary Orbit coordinates
    topics.forEach((topic) => {
      const id = `folder_${topic._id}`;
      const parentRawId = topic.parentId
        ? (typeof topic.parentId === 'object' && topic.parentId._id ? String(topic.parentId._id) : String(topic.parentId))
        : null;

      const domainKey = detectDomain(topic, topicLookup);
      const domainCfg = DOMAINS[domainKey] || DOMAINS.software;
      const isRoot = !parentRawId;
      const totalArticles = topicSubtreeArticleCount.get(String(topic._id)) || 0;

      // Scaled radius reflecting knowledge density
      let nodeRadius = 14;
      let targetRadius = 295;
      let targetAngle = domainCfg.baseAngle;

      if (isRoot) {
        // Root topics orbit at R=180, size scaled with square root of articles
        targetRadius = 180;
        nodeRadius = Math.round(18 + Math.min(16, Math.sqrt(totalArticles) * 4.2));
        targetAngle = domainCfg.baseAngle;
      } else {
        // Check hierarchy depth
        const parentTopic = topicLookup.get(parentRawId);
        const grandParentId = parentTopic?.parentId
          ? (typeof parentTopic.parentId === 'object' && parentTopic.parentId._id ? String(parentTopic.parentId._id) : String(parentTopic.parentId))
          : null;

        const isSubSub = !!grandParentId;
        targetRadius = isSubSub ? 365 : 290;
        nodeRadius = Math.round(12 + Math.min(9, totalArticles * 1.6));

        // Angular spread relative to parent folder
        const siblings = childrenByParent.get(parentRawId) || [topic];
        const sibIndex = siblings.findIndex((s) => String(s._id) === String(topic._id));
        const sibCount = siblings.length;
        const spreadSpan = isSubSub ? 0.35 : 0.65;
        const angleOffset = sibCount > 1 ? (sibIndex - (sibCount - 1) / 2) * (spreadSpan / (sibCount - 1)) : 0;
        targetAngle = domainCfg.baseAngle + angleOffset;
      }

      nodeMap.set(id, {
        id,
        rawId: topic._id,
        type: 'folder',
        label: topic.name || topic.nameEn || 'Folder',
        icon: topic.icon || (isRoot ? '🏛️' : '📁'),
        color: domainCfg.color,
        accentColor: domainCfg.accentColor,
        radius: nodeRadius,
        targetRadius,
        targetAngle,
        domain: domainKey,
        articleCount: totalArticles,
        isRoot,
        parentTopicId: parentRawId,
      });

      // Link root folders to Central Sun
      if (isRoot) {
        links.push({
          id: `core_${topic._id}`,
          source: coreId,
          target: id,
          linkType: 'core-root',
        });
      }

      // Folder-to-parent folder hierarchy link
      if (parentRawId) {
        const parentNodeId = `folder_${parentRawId}`;
        links.push({
          id: `fh_${parentRawId}_${topic._id}`,
          source: parentNodeId,
          target: id,
          linkType: 'folder-hierarchy',
        });
      }
    });

    // C. Add Article (Note) Nodes with Planetary Orbit positions
    const tagSet = new Set();
    articles.forEach((art, artIdx) => {
      const id = `note_${art._id}`;
      const topicId = art.topicId?._id ? String(art.topicId._id) : (art.topicId ? String(art.topicId) : null);
      const topicObj = topicId ? topicLookup.get(topicId) : null;
      const topicName = topicObj?.name || (typeof art.topicId === 'object' && art.topicId?.name) || '';

      const domainKey = topicObj ? detectDomain(topicObj, topicLookup) : 'software';
      const domainCfg = DOMAINS[domainKey] || DOMAINS.software;

      // Find parent folder target angle to orbit nearby
      const parentFolderNode = topicId ? nodeMap.get(`folder_${topicId}`) : null;
      const baseAngle = parentFolderNode ? parentFolderNode.targetAngle : domainCfg.baseAngle;

      const folderArticles = topicId ? (articlesByTopic.get(topicId) || [art]) : [art];
      const artIndexInFolder = folderArticles.findIndex((a) => String(a._id) === String(art._id));
      const artCountInFolder = folderArticles.length;

      const angleOffset =
        artCountInFolder > 1
          ? (artIndexInFolder - (artCountInFolder - 1) / 2) * (0.28 / Math.max(1, artCountInFolder - 1))
          : ((artIdx % 5) - 2) * 0.05;

      // Stagger radius between 410 and 460 to form a natural celestial asteroid/satellite belt
      const targetRadius = 425 + ((artIdx % 3) - 1) * 22;
      const targetAngle = baseAngle + angleOffset;

      nodeMap.set(id, {
        id,
        rawId: art._id,
        type: 'note',
        label: art.title || art.titleEn || 'Untitled Note',
        color: domainCfg.accentColor,
        domainColor: domainCfg.color,
        radius: 10,
        targetRadius,
        targetAngle,
        domain: domainKey,
        topicId,
        topicName,
        summary: art.summary || '',
        tags: Array.isArray(art.tags) ? art.tags : [],
        viewsCount: art.viewsCount || 0,
        updatedAt: art.updatedAt,
        relatedArticles: Array.isArray(art.relatedArticles) ? art.relatedArticles : [],
      });

      // Folder -> Note Link
      if (topicId) {
        const folderId = `folder_${topicId}`;
        links.push({
          id: `fn_${topicId}_${art._id}`,
          source: folderId,
          target: id,
          linkType: 'folder-note',
        });
      }

      // Collect Tags
      if (Array.isArray(art.tags)) {
        art.tags.forEach((tag) => {
          if (tag && typeof tag === 'string' && tag.trim()) {
            const cleanTag = tag.trim();
            tagSet.add(cleanTag);
            links.push({
              id: `nt_${art._id}_${cleanTag}`,
              source: id,
              target: `tag_${cleanTag}`,
              linkType: 'note-tag',
            });
          }
        });
      }

      // Related Articles Link
      if (Array.isArray(art.relatedArticles)) {
        art.relatedArticles.forEach((rel) => {
          const relId = typeof rel === 'object' && rel._id ? rel._id : rel;
          if (relId && String(relId) !== String(art._id)) {
            const pairKey = [String(art._id), String(relId)].sort().join('___');
            links.push({
              id: `rel_${pairKey}`,
              source: id,
              target: `note_${relId}`,
              linkType: 'related-note',
            });
          }
        });
      }
    });

    // D. Add Unique Tag Nodes orbiting at outer perimeter
    const tagArray = Array.from(tagSet);
    tagArray.forEach((tag, tIdx) => {
      const id = `tag_${tag}`;
      const angle = (tIdx / Math.max(1, tagArray.length)) * Math.PI * 2;
      nodeMap.set(id, {
        id,
        rawId: tag,
        type: 'tag',
        label: `#${tag}`,
        color: '#a855f7',
        accentColor: '#c084fc',
        radius: 7,
        targetRadius: 535,
        targetAngle: angle,
        domain: 'tag',
      });
    });

    // Deduplicate links by ID
    const uniqueLinksMap = new Map();
    links.forEach((l) => {
      if (!uniqueLinksMap.has(l.id)) {
        uniqueLinksMap.set(l.id, l);
      }
    });

    return {
      nodes: Array.from(nodeMap.values()),
      links: Array.from(uniqueLinksMap.values()),
      nodeMap,
      domainStats,
    };
  }, [topics, articles, language]);

  // Persistent simulated nodes & links kept in ref across renders
  const simStateRef = useRef({
    nodes: [],
    links: [],
    nodeMap: new Map(),
    adjacency: new Map(),
    domainStats: {},
  });

  const [simVersion, setSimVersion] = useState(0);

  // Initialize simulation positions when graphData changes
  useEffect(() => {
    if (graphData.nodes.length === 0) return;

    const existingPos = new Map();
    simStateRef.current.nodes.forEach((n) => {
      existingPos.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy });
    });

    const initializedNodes = graphData.nodes.map((n) => {
      const prev = existingPos.get(n.id);
      let initX, initY;

      if (prev) {
        initX = prev.x;
        initY = prev.y;
      } else {
        // Place initial node smoothly near its planetary target angle & radius
        const rad = n.targetRadius || 20;
        const ang = n.targetAngle || 0;
        initX = Math.cos(ang) * rad + (Math.random() * 24 - 12);
        initY = Math.sin(ang) * rad + (Math.random() * 24 - 12);
      }

      return {
        ...n,
        x: initX,
        y: initY,
        vx: prev ? prev.vx : 0,
        vy: prev ? prev.vy : 0,
      };
    });

    const nodeLookup = new Map();
    initializedNodes.forEach((n) => nodeLookup.set(n.id, n));

    const resolvedLinks = [];
    const adjacency = new Map();
    initializedNodes.forEach((n) => adjacency.set(n.id, new Set()));

    graphData.links.forEach((l) => {
      const sourceNode = nodeLookup.get(l.source);
      const targetNode = nodeLookup.get(l.target);
      if (sourceNode && targetNode) {
        resolvedLinks.push({
          ...l,
          sourceNode,
          targetNode,
        });
        adjacency.get(sourceNode.id)?.add(targetNode.id);
        adjacency.get(targetNode.id)?.add(sourceNode.id);
      }
    });

    simStateRef.current = {
      nodes: initializedNodes,
      links: resolvedLinks,
      nodeMap: nodeLookup,
      adjacency,
      domainStats: graphData.domainStats,
    };

    alphaRef.current = 1.0;
    setSimVersion((v) => v + 1);

    if (initialSelectedArticleId) {
      const targetId = `note_${initialSelectedArticleId}`;
      const found = nodeLookup.get(targetId);
      if (found) {
        setSelectedNode(found);
      }
    }
  }, [graphData, initialSelectedArticleId]);

  // Filter nodes according to toggle states
  const activeNodes = useMemo(() => {
    return simStateRef.current.nodes.filter((node) => {
      if (node.type === 'core') return true; // Central sun always anchors the graph
      if (node.type === 'folder' && !showFolders) return false;
      if (node.type === 'note' && !showNotes) return false;
      if (node.type === 'tag' && !showTags) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFolders, showNotes, showTags, simVersion]);

  const activeNodeIds = useMemo(() => {
    return new Set(activeNodes.map((n) => n.id));
  }, [activeNodes]);

  const activeLinks = useMemo(() => {
    return simStateRef.current.links.filter(
      (l) => activeNodeIds.has(l.sourceNode.id) && activeNodeIds.has(l.targetNode.id)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNodeIds, simVersion]);

  // Search match set
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const matches = new Set();
    activeNodes.forEach((node) => {
      if (
        node.label.toLowerCase().includes(q) ||
        (node.summary && node.summary.toLowerCase().includes(q)) ||
        (Array.isArray(node.tags) && node.tags.some((t) => t.toLowerCase().includes(q)))
      ) {
        matches.add(node.id);
      }
    });
    return matches;
  }, [searchQuery, activeNodes]);

  // Coordinate conversions
  const screenToWorld = useCallback((screenX, screenY, width, height) => {
    const { x, y, zoom } = cameraRef.current;
    return {
      x: (screenX - width / 2) / zoom - x,
      y: (screenY - height / 2) / zoom - y,
    };
  }, []);

  const worldToScreen = useCallback((worldX, worldY, width, height) => {
    const { x, y, zoom } = cameraRef.current;
    return {
      x: (worldX + x) * zoom + width / 2,
      y: (worldY + y) * zoom + height / 2,
    };
  }, []);

  const getNodeAt = useCallback(
    (worldX, worldY) => {
      const nodes = activeNodes;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const dx = worldX - n.x;
        const dy = worldY - n.y;
        const hitRadius = Math.max(n.radius + 6, 14);
        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          return n;
        }
      }
      return null;
    },
    [activeNodes]
  );

  // 60fps Force Simulation & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      alphaRef.current = Math.max(alphaRef.current, 0.4);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const stepPhysics = () => {
      if (alphaRef.current < 0.005) return;

      const nodes = activeNodes;
      const links = activeLinks;
      const alpha = alphaRef.current;
      const isPlanetary = layoutMode === 'planetary';

      // 1. Orbital Constraints (Planetary) or Center Gravity (Free)
      if (isPlanetary) {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (n.pinned) continue;

          if (n.id === 'core_fti_vault') {
            // Anchor Central Sun firmly at (0, 0)
            n.vx -= n.x * 0.08 * alpha;
            n.vy -= n.y * 0.08 * alpha;
            continue;
          }

          const targetX = Math.cos(n.targetAngle) * n.targetRadius;
          const targetY = Math.sin(n.targetAngle) * n.targetRadius;

          const kOrbit =
            (n.type === 'folder' ? (n.isRoot ? 0.016 : 0.012) : n.type === 'note' ? 0.009 : 0.007) * alpha;

          n.vx += (targetX - n.x) * kOrbit;
          n.vy += (targetY - n.y) * kOrbit;
        }
      } else {
        // Free Mode Center Gravity
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (n.pinned) continue;
          n.vx -= n.x * 0.0008 * alpha;
          n.vy -= n.y * 0.0008 * alpha;
        }
      }

      // 2. Node-Node Repulsion (Coulomb force)
      const kRepulsion = isPlanetary ? 950 : 1200;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const minDist = (a.radius + b.radius) * 1.5;
          const distSq = dx * dx + dy * dy + minDist * minDist;
          const dist = Math.sqrt(distSq);
          const force = (kRepulsion * alpha) / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (!a.pinned) {
            a.vx -= fx;
            a.vy -= fy;
          }
          if (!b.pinned) {
            b.vx += fx;
            b.vy += fy;
          }
        }
      }

      // 3. Link Spring Forces (Hooke's Law)
      for (let i = 0; i < links.length; i++) {
        const l = links[i];
        const s = l.sourceNode;
        const t = l.targetNode;
        if (!s || !t) continue;

        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        let desiredLength = 85;
        let springConstant = 0.04;

        if (l.linkType === 'core-root') {
          desiredLength = 180;
          springConstant = 0.035;
        } else if (l.linkType === 'folder-hierarchy') {
          desiredLength = 120;
          springConstant = 0.045;
        } else if (l.linkType === 'folder-note') {
          desiredLength = 95;
          springConstant = 0.035;
        } else if (l.linkType === 'related-note') {
          desiredLength = 110;
          springConstant = 0.025;
        } else if (l.linkType === 'note-tag') {
          desiredLength = 65;
          springConstant = 0.045;
        }

        const displacement = dist - desiredLength;
        const force = displacement * springConstant * alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!s.pinned) {
          s.vx += fx;
          s.vy += fy;
        }
        if (!t.pinned) {
          t.vx -= fx;
          t.vy -= fy;
        }
      }

      // 4. Integrate velocity with damping
      const damping = isPlanetary ? 0.86 : 0.88;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.pinned) continue;
        n.vx *= damping;
        n.vy *= damping;

        const speedSq = n.vx * n.vx + n.vy * n.vy;
        if (speedSq > 120) {
          const speed = Math.sqrt(speedSq);
          n.vx = (n.vx / speed) * 11;
          n.vy = (n.vy / speed) * 11;
        }

        n.x += n.vx;
        n.y += n.vy;
      }

      alphaRef.current *= 0.985;
    };

    const render = () => {
      stepPhysics();

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.save();
      ctx.scale(dpr, dpr);

      // A. Background Render
      const isDark = theme === 'dark';
      ctx.fillStyle = isDark ? '#080c14' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      const { x: camX, y: camY, zoom } = cameraRef.current;

      // Subtle Starlight Dots
      ctx.fillStyle = isDark ? 'rgba(51, 65, 85, 0.35)' : 'rgba(203, 213, 225, 0.6)';
      const dotSpacing = 36 * zoom;
      if (dotSpacing >= 12) {
        const offsetX = ((camX * zoom + width / 2) % dotSpacing + dotSpacing) % dotSpacing;
        const offsetY = ((camY * zoom + height / 2) % dotSpacing + dotSpacing) % dotSpacing;
        for (let gx = offsetX; gx < width; gx += dotSpacing) {
          for (let gy = offsetY; gy < height; gy += dotSpacing) {
            ctx.beginPath();
            ctx.arc(gx, gy, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Camera transformation
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(camX, camY);

      const focusedNode = hoveredNode || selectedNode;
      const focusedNeighborSet = new Set();
      if (focusedNode) {
        focusedNeighborSet.add(focusedNode.id);
        const neighbors = simStateRef.current.adjacency.get(focusedNode.id);
        if (neighbors) {
          neighbors.forEach((nid) => focusedNeighborSet.add(nid));
        }
      }

      // B. Planetary Background: Concentric Celestial Orbit Rings & Knowledge Density Nebulae
      if (layoutMode === 'planetary') {
        ctx.save();

        // 1. Concentric Celestial Orbit Rings
        ctx.setLineDash([4, 7]);
        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.28)';
        ctx.lineWidth = 1 / zoom;

        const orbits = [180, 290, 425, 535];
        orbits.forEach((r) => {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        // 2. Knowledge Density Halos (Domain Cluster Nebulae)
        const dStats = simStateRef.current.domainStats || {};
        Object.values(DOMAINS).forEach((dom) => {
          const count = dStats[dom.key]?.articleCount || 0;
          // Radius expands with article count (dense areas have vibrant large halos)
          const haloRadius = 90 + Math.min(160, count * 13);
          const hx = Math.cos(dom.baseAngle) * 240;
          const hy = Math.sin(dom.baseAngle) * 240;

          const grad = ctx.createRadialGradient(hx, hy, 15, hx, hy, haloRadius);
          grad.addColorStop(0, dom.haloColor);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(hx, hy, haloRadius, 0, Math.PI * 2);
          ctx.fill();
        });

        // 3. Central Sun Solar Corona Glow
        const sunGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, 75);
        sunGlow.addColorStop(0, isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.22)');
        sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // C. Render Links with Gradients
      const links = activeLinks;
      for (let i = 0; i < links.length; i++) {
        const l = links[i];
        const s = l.sourceNode;
        const t = l.targetNode;
        if (!s || !t) continue;

        const isConnectedToFocused =
          focusedNode && (s.id === focusedNode.id || t.id === focusedNode.id);
        const isDimmed = focusedNode && !isConnectedToFocused;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        if (l.linkType === 'related-note') {
          ctx.setLineDash([4, 4]);
        } else if (l.linkType === 'core-root') {
          ctx.setLineDash([3, 5]);
        } else {
          ctx.setLineDash([]);
        }

        if (isConnectedToFocused) {
          ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
          ctx.lineWidth = 2.4 / zoom;
          ctx.shadowColor = isDark ? 'rgba(56, 189, 248, 0.8)' : 'transparent';
          ctx.shadowBlur = isDark ? 8 : 0;
        } else {
          ctx.shadowBlur = 0;
          if (l.linkType === 'core-root') {
            ctx.strokeStyle = isDark
              ? (isDimmed ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.55)')
              : (isDimmed ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.45)');
            ctx.lineWidth = 1.8 / zoom;
          } else if (l.linkType === 'related-note') {
            ctx.strokeStyle = isDark
              ? (isDimmed ? 'rgba(244, 63, 94, 0.12)' : 'rgba(244, 63, 94, 0.55)')
              : (isDimmed ? 'rgba(225, 29, 72, 0.1)' : 'rgba(225, 29, 72, 0.45)');
            ctx.lineWidth = 1.2 / zoom;
          } else {
            // Gradient link between nodes
            if (!isDimmed && zoom >= 0.7) {
              try {
                const grad = ctx.createLinearGradient(s.x, s.y, t.x, t.y);
                grad.addColorStop(0, s.color);
                grad.addColorStop(1, t.color);
                ctx.strokeStyle = grad;
              } catch {
                ctx.strokeStyle = isDark ? 'rgba(71, 85, 105, 0.45)' : 'rgba(148, 163, 184, 0.6)';
              }
            } else {
              ctx.strokeStyle = isDark
                ? (isDimmed ? 'rgba(71, 85, 105, 0.12)' : 'rgba(71, 85, 105, 0.45)')
                : (isDimmed ? 'rgba(203, 213, 225, 0.2)' : 'rgba(148, 163, 184, 0.55)');
            }
            ctx.lineWidth = (l.linkType === 'folder-hierarchy' ? 1.6 : 1.1) / zoom;
          }
        }

        ctx.stroke();
      }
      ctx.setLineDash([]);

      // D. Render Nodes
      const nodes = activeNodes;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHovered = hoveredNode?.id === n.id;
        const isSelected = selectedNode?.id === n.id;
        const isNeighbor = focusedNode && focusedNeighborSet.has(n.id);
        const isDimmed = focusedNode && !isNeighbor;
        const isSearchMatch = searchMatches && searchMatches.has(n.id);

        const currentRadius = isHovered || isSelected ? n.radius * 1.25 : n.radius;

        // Search Match Ring Pulse
        if (isSearchMatch) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(n.x, n.y, currentRadius + 5 / zoom, 0, Math.PI * 2);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5 / zoom;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.restore();
        }

        // Focused Node Aura
        if (isHovered || isSelected) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(n.x, n.y, currentRadius + 4 / zoom, 0, Math.PI * 2);
          ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
          ctx.lineWidth = 1.8 / zoom;
          ctx.shadowColor = n.color;
          ctx.shadowBlur = 14;
          ctx.stroke();
          ctx.restore();
        }

        // Main Node Body
        ctx.save();
        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius, 0, Math.PI * 2);

        if (isDimmed) {
          ctx.globalAlpha = 0.2;
        } else {
          ctx.globalAlpha = 1.0;
        }

        if (n.type === 'core') {
          // Central Sun Node: Rich Golden Radial Gradient
          const coreGrad = ctx.createRadialGradient(n.x - 6, n.y - 6, 2, n.x, n.y, currentRadius);
          coreGrad.addColorStop(0, '#fef08a');
          coreGrad.addColorStop(0.6, '#f59e0b');
          coreGrad.addColorStop(1, '#d97706');
          ctx.fillStyle = coreGrad;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 18;
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.6 / zoom;
          ctx.stroke();

          // Sun Icon inside core
          ctx.font = `${Math.round(14 / Math.sqrt(zoom))}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🪐', n.x, n.y);
        } else {
          if (!isDimmed && isDark) {
            ctx.shadowColor = n.color;
            ctx.shadowBlur = n.type === 'folder' ? 12 : 8;
          }
          ctx.fillStyle = n.color;
          ctx.fill();

          ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 1.2 / zoom;
          ctx.stroke();
        }
        ctx.restore();

        // E. Knowledge Density Badge on Folder Nodes (Shows Article Count!)
        if (n.type === 'folder' && n.articleCount > 0 && !isDimmed) {
          ctx.save();
          const badgeText = String(n.articleCount);
          const badgeRadius = 7.5 / Math.sqrt(zoom);
          const badgeX = n.x + currentRadius * 0.72;
          const badgeY = n.y - currentRadius * 0.72;

          ctx.beginPath();
          ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
          ctx.fill();
          ctx.strokeStyle = n.color;
          ctx.lineWidth = 1.4 / zoom;
          ctx.stroke();

          ctx.font = `700 ${Math.max(7, Math.round(9 / Math.sqrt(zoom)))}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isDark ? n.accentColor || '#ffffff' : n.color;
          ctx.fillText(badgeText, badgeX, badgeY);
          ctx.restore();
        }

        // F. Node Label Rendering (Clean view: hubs show at all times, notes show on zoom or hover)
        const shouldShowLabel =
          zoom >= 1.25 ||
          n.type === 'core' ||
          n.type === 'folder' ||
          isHovered ||
          isSelected ||
          isNeighbor ||
          isSearchMatch;

        if (shouldShowLabel) {
          ctx.save();
          if (isDimmed) {
            ctx.globalAlpha = 0.25;
          } else {
            ctx.globalAlpha = 1.0;
          }

          const fontSize = Math.max(
            9,
            Math.min(13, (n.type === 'core' ? 13 : n.type === 'folder' ? 12 : 11) / Math.sqrt(zoom))
          );
          ctx.font = `${isHovered || isSelected || isSearchMatch || n.type === 'core' ? '600' : '400'} ${fontSize}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          // Text halo
          ctx.strokeStyle = isDark ? 'rgba(8, 12, 20, 0.9)' : 'rgba(248, 250, 252, 0.92)';
          ctx.lineWidth = 3.5;
          ctx.lineJoin = 'round';
          ctx.strokeText(n.label, n.x, n.y + currentRadius + 4);

          ctx.fillStyle = isDark
            ? (isHovered || isSelected || isSearchMatch || n.type === 'core' ? '#ffffff' : '#cbd5e1')
            : (isHovered || isSelected || isSearchMatch || n.type === 'core' ? '#0f172a' : '#334155');
          ctx.fillText(n.label, n.x, n.y + currentRadius + 4);
          ctx.restore();
        }
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [activeNodes, activeLinks, theme, layoutMode, hoveredNode, selectedNode, searchMatches, getNodeAt]);

  // Mouse / Touch handlers
  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const world = screenToWorld(mouseX, mouseY, rect.width, rect.height);
    const hit = getNodeAt(world.x, world.y);

    if (hit) {
      isDraggingRef.current = true;
      dragTargetRef.current = hit;
      hit.pinned = true;
      hit.fx = hit.x;
      hit.fy = hit.y;
      alphaRef.current = Math.max(alphaRef.current, 0.5);
    } else {
      isPanningRef.current = true;
      dragStartRef.current = {
        x: mouseX - cameraRef.current.x * cameraRef.current.zoom,
        y: mouseY - cameraRef.current.y * cameraRef.current.zoom,
      };
    }
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    mousePosRef.current = { x: mouseX, y: mouseY };

    if (isPanningRef.current) {
      cameraRef.current.x = (mouseX - dragStartRef.current.x) / cameraRef.current.zoom;
      cameraRef.current.y = (mouseY - dragStartRef.current.y) / cameraRef.current.zoom;
      return;
    }

    if (isDraggingRef.current && dragTargetRef.current) {
      const world = screenToWorld(mouseX, mouseY, rect.width, rect.height);
      const node = dragTargetRef.current;
      node.x = world.x;
      node.y = world.y;
      node.vx = 0;
      node.vy = 0;
      alphaRef.current = Math.max(alphaRef.current, 0.4);
      return;
    }

    const world = screenToWorld(mouseX, mouseY, rect.width, rect.height);
    const hit = getNodeAt(world.x, world.y);
    setHoveredNode(hit);

    if (canvasRef.current) {
      canvasRef.current.style.cursor = hit ? 'pointer' : isPanningRef.current ? 'grabbing' : 'grab';
    }
  };

  const handleMouseUp = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current && dragTargetRef.current) {
      dragTargetRef.current.pinned = false;
      dragTargetRef.current = null;
      isDraggingRef.current = false;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
    }

    const world = screenToWorld(mouseX, mouseY, rect.width, rect.height);
    const hit = getNodeAt(world.x, world.y);
    if (hit) {
      setSelectedNode(hit);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const currentZoom = cameraRef.current.zoom;
    const newZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.2), 3.5);

    const worldBefore = screenToWorld(mouseX, mouseY, rect.width, rect.height);
    cameraRef.current.zoom = newZoom;
    const worldAfter = screenToWorld(mouseX, mouseY, rect.width, rect.height);

    cameraRef.current.x += worldAfter.x - worldBefore.x;
    cameraRef.current.y += worldAfter.y - worldBefore.y;
    alphaRef.current = Math.max(alphaRef.current, 0.1);
  };

  const handleResetCamera = () => {
    cameraRef.current = { x: 0, y: 0, zoom: 0.95 };
    alphaRef.current = 0.8;
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const selectedNodeDetails = useMemo(() => {
    if (!selectedNode) return null;

    const neighborIds = simStateRef.current.adjacency.get(selectedNode.id) || new Set();
    const neighbors = Array.from(neighborIds)
      .map((id) => simStateRef.current.nodeMap.get(id))
      .filter(Boolean);

    return {
      ...selectedNode,
      neighbors,
    };
  }, [selectedNode]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none transition-colors duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen bg-slate-950'
          : 'h-[750px] rounded-2xl border shadow-sm'
      } ${
        theme === 'dark'
          ? 'bg-[#080c14] border-slate-800 text-slate-100'
          : 'bg-[#f8fafc] border-slate-200 text-slate-900'
      }`}
    >
      {/* 1. Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="absolute inset-0 block h-full w-full cursor-grab active:cursor-grabbing"
      />

      {/* 2. Top Header Control Toolbar */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Stats Badge & Search Input */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Stats Badge */}
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium backdrop-blur-md border shadow-xs ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                : 'bg-white/85 border-slate-200/80 text-slate-700'
            }`}
          >
            <span className="text-amber-400">🪐</span>
            <span>
              {t('graphNodesCount', { count: activeNodes.length })} ·{' '}
              {t('graphEdgesCount', { count: activeLinks.length })}
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchGraph')}
              className={`w-44 sm:w-60 rounded-xl px-3 py-1.5 pl-8 text-xs font-normal backdrop-blur-md border transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark'
                  ? 'bg-slate-900/80 border-slate-800 text-slate-100 placeholder-slate-500'
                  : 'bg-white/85 border-slate-200/80 text-slate-900 placeholder-slate-400'
              }`}
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              🔍
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Center/Right: Layout Switcher, Filter Toggles & Actions */}
        <div className="flex items-center gap-1.5 pointer-events-auto flex-wrap">
          {/* Layout Mode Switcher */}
          <div
            className={`flex items-center gap-1 rounded-xl p-1 backdrop-blur-md border shadow-xs ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                : 'bg-white/85 border-slate-200/80 text-slate-700'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setLayoutMode('planetary');
                alphaRef.current = 1.0;
              }}
              title={t('planetaryLayout')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                layoutMode === 'planetary'
                  ? theme === 'dark'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-slate-400 opacity-60 hover:opacity-100'
              }`}
            >
              <span>🪐</span>
              <span className="hidden sm:inline">{t('planetaryLayout')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLayoutMode('free');
                alphaRef.current = 1.0;
              }}
              title={t('freeLayout')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                layoutMode === 'free'
                  ? theme === 'dark'
                    ? 'bg-blue-500/20 text-blue-400 font-semibold'
                    : 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-400 opacity-60 hover:opacity-100'
              }`}
            >
              <span>🌐</span>
              <span className="hidden sm:inline">{t('freeLayout')}</span>
            </button>
          </div>

          {/* Filter Toggles */}
          <div
            className={`flex items-center gap-1 rounded-xl p-1 backdrop-blur-md border shadow-xs ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                : 'bg-white/85 border-slate-200/80 text-slate-700'
            }`}
          >
            {/* Toggle Folders */}
            <button
              type="button"
              onClick={() => {
                setShowFolders(!showFolders);
                alphaRef.current = 0.5;
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                showFolders
                  ? theme === 'dark'
                    ? 'bg-blue-500/20 text-blue-400 font-semibold'
                    : 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-400 opacity-60 hover:opacity-100'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="hidden sm:inline">{t('showFolders')}</span>
            </button>

            {/* Toggle Notes */}
            <button
              type="button"
              onClick={() => {
                setShowNotes(!showNotes);
                alphaRef.current = 0.5;
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                showNotes
                  ? theme === 'dark'
                    ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                    : 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-400 opacity-60 hover:opacity-100'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">{t('showNotes')}</span>
            </button>

            {/* Toggle Tags */}
            <button
              type="button"
              onClick={() => {
                setShowTags(!showTags);
                alphaRef.current = 0.5;
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                showTags
                  ? theme === 'dark'
                    ? 'bg-purple-500/20 text-purple-400 font-semibold'
                    : 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-slate-400 opacity-60 hover:opacity-100'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="hidden sm:inline">{t('showTags')}</span>
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? t('graphThemeLight') : t('graphThemeDark')}
            className={`flex h-8 w-8 items-center justify-center rounded-xl backdrop-blur-md border text-xs shadow-xs transition-colors ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-slate-800 text-amber-300 hover:bg-slate-800'
                : 'bg-white/85 border-slate-200/80 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={handleResetCamera}
            title={t('resetGraph')}
            className={`flex h-8 w-8 items-center justify-center rounded-xl backdrop-blur-md border text-xs shadow-xs transition-colors ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white/85 border-slate-200/80 text-slate-700 hover:bg-slate-100'
            }`}
          >
            ↺
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
            className={`flex h-8 w-8 items-center justify-center rounded-xl backdrop-blur-md border text-xs shadow-xs transition-colors ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white/85 border-slate-200/80 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>
        </div>
      </div>

      {/* 3. Bottom Helper Legend with Domain Sectors & Density Guide */}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 pointer-events-none">
        <div
          className={`flex flex-wrap items-center gap-3 rounded-xl px-3 py-1.5 text-[11px] font-medium backdrop-blur-md border shadow-xs ${
            theme === 'dark'
              ? 'bg-slate-900/80 border-slate-800 text-slate-300'
              : 'bg-white/85 border-slate-200/80 text-slate-700'
          }`}
        >
          {/* Domain Spectrum Indicators */}
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-xs shadow-sky-500/50" />
            <span>{language === 'th' ? 'ซอฟต์แวร์' : 'Software'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-xs shadow-orange-500/50" />
            <span>{language === 'th' ? 'ฮาร์ดแวร์ & CCTV' : 'Hardware & CCTV'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            <span>{language === 'th' ? 'เครือข่าย' : 'Network'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500 shadow-xs shadow-purple-500/50" />
            <span>{language === 'th' ? 'ความปลอดภัย' : 'Security'}</span>
          </div>

          <span className="hidden md:inline border-l border-slate-700/50 pl-2 text-[10px] text-amber-400">
            {language === 'th'
              ? '🪐 รัศมีวงเรืองแสงและขนาดโหนดแสดงความหนาแน่นความรู้'
              : '🪐 Halo radius & node size reflect knowledge density'}
          </span>
        </div>
      </div>

      {/* 4. Floating Quick Preview Card */}
      {selectedNodeDetails && (
        <div
          className={`absolute bottom-3 right-3 w-80 sm:w-96 rounded-2xl p-4 backdrop-blur-xl border shadow-2xl transition-all duration-200 pointer-events-auto ${
            theme === 'dark'
              ? 'bg-slate-900/90 border-slate-700/80 text-slate-100'
              : 'bg-white/95 border-slate-200 text-slate-900'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  selectedNodeDetails.type === 'core'
                    ? 'bg-amber-500/20 text-amber-400'
                    : selectedNodeDetails.type === 'folder'
                    ? 'bg-blue-500/20 text-blue-400'
                    : selectedNodeDetails.type === 'note'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                {selectedNodeDetails.type === 'core'
                  ? (language === 'th' ? 'แกนกลางคลังความรู้' : 'Knowledge Core')
                  : selectedNodeDetails.type === 'folder'
                  ? t('showFolders')
                  : selectedNodeDetails.type === 'note'
                  ? t('showNotes')
                  : t('showTags')}
              </span>
              {selectedNodeDetails.topicName && (
                <span className="truncate text-xs text-slate-400">
                  📂 {selectedNodeDetails.topicName}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="h-6 w-6 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>

          {/* Title */}
          <h4 className="font-semibold text-sm leading-snug line-clamp-2 mb-1.5 flex items-center gap-1.5">
            {selectedNodeDetails.icon ? <span>{selectedNodeDetails.icon}</span> : null}
            <span>{selectedNodeDetails.label}</span>
          </h4>

          {/* Central Sun Breakdown Overview */}
          {selectedNodeDetails.type === 'core' && selectedNodeDetails.domainStats && (
            <div className="my-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-xs space-y-1.5">
              <span className="block font-semibold text-amber-400 text-[11px] uppercase tracking-wider">
                {language === 'th' ? 'สรุปความหนาแน่นรายเซกเตอร์' : 'Domain Knowledge Breakdown'}
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between rounded-lg bg-sky-950/30 border border-sky-800/30 px-2 py-1 text-sky-300">
                  <span>💻 ซอฟต์แวร์</span>
                  <span className="font-bold">{selectedNodeDetails.domainStats.software?.articleCount || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-orange-950/30 border border-orange-800/30 px-2 py-1 text-orange-300">
                  <span>⚙️ ฮาร์ดแวร์</span>
                  <span className="font-bold">{selectedNodeDetails.domainStats.hardware?.articleCount || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-950/30 border border-emerald-800/30 px-2 py-1 text-emerald-300">
                  <span>🌐 เครือข่าย</span>
                  <span className="font-bold">{selectedNodeDetails.domainStats.network?.articleCount || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-purple-950/30 border border-purple-800/30 px-2 py-1 text-purple-300">
                  <span>🔒 ความปลอดภัย</span>
                  <span className="font-bold">{selectedNodeDetails.domainStats.security?.articleCount || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Note Summary / Snippet */}
          {selectedNodeDetails.summary && (
            <p className="text-xs text-slate-400 line-clamp-3 mb-3 leading-relaxed">
              {selectedNodeDetails.summary}
            </p>
          )}

          {/* Tags */}
          {selectedNodeDetails.tags && selectedNodeDetails.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {selectedNodeDetails.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-purple-300'
                      : 'bg-purple-50 text-purple-700'
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Connected Relations list */}
          {selectedNodeDetails.neighbors && selectedNodeDetails.neighbors.length > 0 && (
            <div className="border-t border-slate-800/60 pt-2 mb-3">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {t('connectedLinks')} ({selectedNodeDetails.neighbors.length})
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {selectedNodeDetails.neighbors.map((neighbor) => (
                  <button
                    key={neighbor.id}
                    type="button"
                    onClick={() => setSelectedNode(neighbor)}
                    className={`truncate max-w-[170px] rounded-md px-2 py-0.5 text-[11px] transition-colors ${
                      neighbor.type === 'core'
                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                        : neighbor.type === 'folder'
                        ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                        : neighbor.type === 'note'
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                    }`}
                  >
                    {neighbor.icon || (neighbor.type === 'folder' ? '📁 ' : neighbor.type === 'tag' ? '#' : '📄 ')}
                    {neighbor.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Button: If Note, Open Full Article */}
          {selectedNodeDetails.type === 'note' && (
            <button
              type="button"
              onClick={() => onOpenArticle?.(selectedNodeDetails.rawId)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{t('openFullArticle')}</span>
              <span>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
