import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import useLanguage from '../../hooks/useLanguage.js';

/**
 * ObsidianGraphView - Interactive 2D Knowledge Graph
 * 
 * Features:
 * - Native HTML5 Canvas 2D Force-Directed Simulation (0 extra npm dependencies)
 * - 3 Node types: Folders (hub nodes), Notes (content nodes), Tags (connector nodes)
 * - Dynamic Links: Folder-to-Folder, Folder-to-Note, Note-to-Tag, Note-to-Related Note
 * - Interactive: Drag nodes, Pan & Zoom canvas, Hover highlight neighbors, Click to Quick Preview
 * - Floating Quick Preview card with "Open Full Article" action
 * - Filter controls (Toggle Folders/Notes/Tags, Search query filter)
 * - Obsidian Dark & Clean Light themes
 * - Fullscreen mode support
 */
export default function ObsidianGraphView({
  topics = [],
  articles = [],
  onOpenArticle,
  initialSelectedArticleId = null,
}) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // View & UI states
  const [theme, setTheme] = useState('dark'); // 'dark' (Obsidian) | 'light'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolders, setShowFolders] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Camera & Physics state references (kept in refs for 60fps canvas loop)
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const isDraggingRef = useRef(false);
  const dragTargetRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);

  // Simulation alpha/energy to pause calculation when settled
  const alphaRef = useRef(1);

  // 1. Transform raw topics & articles into Graph Nodes & Links
  const graphData = useMemo(() => {
    const nodeMap = new Map();
    const links = [];

    // Map of topic id to topic object for fast lookup
    const topicLookup = new Map();
    topics.forEach((topic) => topicLookup.set(String(topic._id), topic));

    // A. Add Topic (Folder) Nodes
    topics.forEach((topic) => {
      const id = `folder_${topic._id}`;
      // parentId can be a populated object {_id, name} or a raw ObjectId string or null
      const parentRawId = topic.parentId
        ? (typeof topic.parentId === 'object' && topic.parentId._id ? String(topic.parentId._id) : String(topic.parentId))
        : null;

      nodeMap.set(id, {
        id,
        rawId: topic._id,
        type: 'folder',
        label: topic.name || topic.nameEn || 'Folder',
        icon: topic.icon || '📁',
        color: '#3b82f6', // Bright Folder Blue
        radius: 16,
        parentTopicId: parentRawId,
      });

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

    // B. Add Article (Note) Nodes & Tags
    const tagSet = new Set();
    articles.forEach((art) => {
      const id = `note_${art._id}`;
      const topicId = art.topicId?._id ? String(art.topicId._id) : (art.topicId ? String(art.topicId) : null);
      const topicObj = topicId ? topicLookup.get(topicId) : null;
      // When topicId is populated, its name is on art.topicId.name
      const topicName = topicObj?.name || (typeof art.topicId === 'object' && art.topicId?.name) || '';

      nodeMap.set(id, {
        id,
        rawId: art._id,
        type: 'note',
        label: art.title || art.titleEn || 'Untitled Note',
        color: '#10b981', // Emerald Green
        radius: 11,
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
            // Sort IDs to prevent duplicate bidirectional links
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

    // C. Add Unique Tag Nodes
    tagSet.forEach((tag) => {
      const id = `tag_${tag}`;
      nodeMap.set(id, {
        id,
        rawId: tag,
        type: 'tag',
        label: `#${tag}`,
        color: '#a855f7', // Purple
        radius: 7,
      });
    });

    // Deduplicate links by link ID
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
    };
  }, [topics, articles]);

  // Persistent simulated nodes & links kept in ref across renders
  const simStateRef = useRef({
    nodes: [],
    links: [],
    nodeMap: new Map(),
    adjacency: new Map(), // nodeId -> Set of neighbor nodeIds
  });

  // Version counter to force re-computation of activeNodes/activeLinks after simStateRef updates
  const [simVersion, setSimVersion] = useState(0);

  // Update simulation structure when graphData changes
  useEffect(() => {
    if (graphData.nodes.length === 0) return;

    const existingPos = new Map();
    simStateRef.current.nodes.forEach((n) => {
      existingPos.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy });
    });

    const angleStep = (2 * Math.PI) / Math.max(1, graphData.nodes.length);
    const radius = Math.min(300, 20 + graphData.nodes.length * 8);

    const initializedNodes = graphData.nodes.map((n, idx) => {
      const prev = existingPos.get(n.id);
      const initX = prev ? prev.x : Math.cos(angleStep * idx) * (radius + (Math.random() * 80 - 40));
      const initY = prev ? prev.y : Math.sin(angleStep * idx) * (radius + (Math.random() * 80 - 40));

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

    // Resolve source & target object references for physics
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
    };

    alphaRef.current = 1.0; // restart physics animation

    // Bump version to trigger re-computation of activeNodes/activeLinks
    setSimVersion((v) => v + 1);

    // Auto-select initial note if passed in
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

  // Screen <-> World coordinate conversion helpers
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

  // Find node under world coordinates
  const getNodeAt = useCallback((worldX, worldY) => {
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
  }, [activeNodes]);

  // Main 60fps Force Simulation & Render Loop
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

    const stepPhysics = (dt) => {
      if (alphaRef.current < 0.005) return; // Simulation is settled

      const nodes = activeNodes;
      const links = activeLinks;
      const alpha = alphaRef.current;

      // 1. Center gravity force (pulls slightly toward world 0,0)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.pinned) continue;
        n.vx -= n.x * 0.0008 * alpha;
        n.vy -= n.y * 0.0008 * alpha;
      }

      // 2. Node-node repulsion (Coulomb force)
      const kRepulsion = 1200;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy + 400; // avoid singularity
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

      // 3. Link spring force (Hooke's law)
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
        if (l.linkType === 'folder-hierarchy') {
          desiredLength = 130;
          springConstant = 0.05;
        } else if (l.linkType === 'folder-note') {
          desiredLength = 95;
          springConstant = 0.04;
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
      const damping = 0.88;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.pinned) continue;
        n.vx *= damping;
        n.vy *= damping;

        // Cap max velocity to avoid violent explosions
        const speedSq = n.vx * n.vx + n.vy * n.vy;
        if (speedSq > 100) {
          const speed = Math.sqrt(speedSq);
          n.vx = (n.vx / speed) * 10;
          n.vy = (n.vy / speed) * 10;
        }

        n.x += n.vx;
        n.y += n.vy;
      }

      // Decay alpha
      alphaRef.current *= 0.985;
    };

    const render = () => {
      stepPhysics(1);

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.save();
      ctx.scale(dpr, dpr);

      // A. Background Render
      const isDark = theme === 'dark';
      ctx.fillStyle = isDark ? '#090d16' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      const { x: camX, y: camY, zoom } = cameraRef.current;

      // Subtle background grid dots
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

      // Apply camera transformation to world coordinates
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(camX, camY);

      // Determine hover/selected context for dimming
      const focusedNode = hoveredNode || selectedNode;
      const focusedNeighborSet = new Set();
      if (focusedNode) {
        focusedNeighborSet.add(focusedNode.id);
        const neighbors = simStateRef.current.adjacency.get(focusedNode.id);
        if (neighbors) {
          neighbors.forEach((nid) => focusedNeighborSet.add(nid));
        }
      }

      // B. Render Links
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
        } else {
          ctx.setLineDash([]);
        }

        if (isConnectedToFocused) {
          ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
          ctx.lineWidth = 2.2 / zoom;
          ctx.shadowColor = isDark ? 'rgba(56, 189, 248, 0.8)' : 'transparent';
          ctx.shadowBlur = isDark ? 8 : 0;
        } else {
          ctx.shadowBlur = 0;
          if (l.linkType === 'related-note') {
            ctx.strokeStyle = isDark
              ? (isDimmed ? 'rgba(244, 63, 94, 0.12)' : 'rgba(244, 63, 94, 0.55)')
              : (isDimmed ? 'rgba(225, 29, 72, 0.1)' : 'rgba(225, 29, 72, 0.45)');
          } else {
            ctx.strokeStyle = isDark
              ? (isDimmed ? 'rgba(71, 85, 105, 0.15)' : 'rgba(71, 85, 105, 0.45)')
              : (isDimmed ? 'rgba(203, 213, 225, 0.25)' : 'rgba(148, 163, 184, 0.6)');
          }
          ctx.lineWidth = (l.linkType === 'folder-hierarchy' ? 1.6 : 1.1) / zoom;
        }

        ctx.stroke();
      }
      ctx.setLineDash([]); // Reset line dash

      // C. Render Nodes
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
          ctx.strokeStyle = '#f59e0b'; // Amber pulsing ring
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
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.restore();
        }

        // Draw Main Node Circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius, 0, Math.PI * 2);

        // Alpha handling for dimming
        if (isDimmed) {
          ctx.globalAlpha = 0.2;
        } else {
          ctx.globalAlpha = 1.0;
        }

        // Glowing fill
        if (!isDimmed && isDark) {
          ctx.shadowColor = n.color;
          ctx.shadowBlur = 10;
        }
        ctx.fillStyle = n.color;
        ctx.fill();

        // White border
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.2 / zoom;
        ctx.stroke();
        ctx.restore();

        // Node Label Rendering
        // Only render labels if zoom is high enough, or if node is hovered/selected/search match/folder
        const shouldShowLabel =
          zoom >= 0.85 ||
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

          const fontSize = Math.max(9, Math.min(13, (n.type === 'folder' ? 12 : 11) / Math.sqrt(zoom)));
          ctx.font = `${isHovered || isSelected || isSearchMatch ? '600' : '400'} ${fontSize}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          // Text halo/outline for high legibility
          ctx.strokeStyle = isDark ? 'rgba(9, 13, 22, 0.85)' : 'rgba(248, 250, 252, 0.9)';
          ctx.lineWidth = 3;
          ctx.lineJoin = 'round';
          ctx.strokeText(n.label, n.x, n.y + currentRadius + 4);

          ctx.fillStyle = isDark
            ? (isHovered || isSelected || isSearchMatch ? '#ffffff' : '#cbd5e1')
            : (isHovered || isSelected || isSearchMatch ? '#0f172a' : '#334155');
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
  }, [activeNodes, activeLinks, theme, hoveredNode, selectedNode, searchMatches, getNodeAt]);

  // Mouse / Touch interaction handlers
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
      alphaRef.current = Math.max(alphaRef.current, 0.5); // wake physics
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

    // Pan camera
    if (isPanningRef.current) {
      cameraRef.current.x = (mouseX - dragStartRef.current.x) / cameraRef.current.zoom;
      cameraRef.current.y = (mouseY - dragStartRef.current.y) / cameraRef.current.zoom;
      return;
    }

    // Drag node
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

    // Check hover
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
      // Unpin node after dragging so physics relaxes it smoothly
      dragTargetRef.current.pinned = false;
      dragTargetRef.current = null;
      isDraggingRef.current = false;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
    }

    // Handle click selection if not dragged far
    const world = screenToWorld(mouseX, mouseY, rect.width, rect.height);
    const hit = getNodeAt(world.x, world.y);
    if (hit) {
      setSelectedNode(hit);
    }
  };

  // Zoom with mouse wheel
  const handleWheel = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const currentZoom = cameraRef.current.zoom;
    const newZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.25), 3.5);

    // Zoom centered around mouse cursor
    const worldBefore = screenToWorld(mouseX, mouseY, rect.width, rect.height);
    cameraRef.current.zoom = newZoom;
    const worldAfter = screenToWorld(mouseX, mouseY, rect.width, rect.height);

    cameraRef.current.x += worldAfter.x - worldBefore.x;
    cameraRef.current.y += worldAfter.y - worldBefore.y;
    alphaRef.current = Math.max(alphaRef.current, 0.1);
  };

  // Reset Camera View
  const handleResetCamera = () => {
    cameraRef.current = { x: 0, y: 0, zoom: 1 };
    alphaRef.current = 0.8;
  };

  // Toggle Fullscreen
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

  // Quick Preview Details for Selected Node
  const selectedNodeDetails = useMemo(() => {
    if (!selectedNode) return null;

    // Direct connected neighbors
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
          : 'h-[720px] rounded-2xl border shadow-sm'
      } ${
        theme === 'dark'
          ? 'bg-[#090d16] border-slate-800 text-slate-100'
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
            <span className="text-blue-500">🕸️</span>
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
              className={`w-48 sm:w-64 rounded-xl px-3 py-1.5 pl-8 text-xs font-normal backdrop-blur-md border transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
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

        {/* Center/Right: Filter Toggles & Actions */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
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
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                showFolders
                  ? theme === 'dark'
                    ? 'bg-blue-500/20 text-blue-400 font-semibold'
                    : 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-400 opacity-60 hover:opacity-100'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>{t('showFolders')}</span>
            </button>

            {/* Toggle Notes */}
            <button
              type="button"
              onClick={() => {
                setShowNotes(!showNotes);
                alphaRef.current = 0.5;
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                showNotes
                  ? theme === 'dark'
                    ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                    : 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-400 opacity-60 hover:opacity-100'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{t('showNotes')}</span>
            </button>

            {/* Toggle Tags */}
            <button
              type="button"
              onClick={() => {
                setShowTags(!showTags);
                alphaRef.current = 0.5;
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                showTags
                  ? theme === 'dark'
                    ? 'bg-purple-500/20 text-purple-400 font-semibold'
                    : 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-slate-400 opacity-60 hover:opacity-100'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span>{t('showTags')}</span>
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

      {/* 3. Bottom Helper Legend & Tip */}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 pointer-events-none">
        <div
          className={`flex items-center gap-3 rounded-xl px-3 py-1.5 text-[11px] font-medium backdrop-blur-md border shadow-xs ${
            theme === 'dark'
              ? 'bg-slate-900/80 border-slate-800 text-slate-400'
              : 'bg-white/85 border-slate-200/80 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>{t('showFolders')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{t('showNotes')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            <span>{t('showTags')}</span>
          </div>
          <span className="hidden sm:inline border-l border-slate-700/40 pl-2 text-[10px] text-slate-400">
            {t('graphHelpTooltip')}
          </span>
        </div>
      </div>

      {/* 4. Floating Quick Preview Card (Drawer on Selected Node) */}
      {selectedNodeDetails && (
        <div
          className={`absolute bottom-3 right-3 w-80 sm:w-96 rounded-2xl p-4 backdrop-blur-xl border shadow-2xl transition-all duration-200 pointer-events-auto ${
            theme === 'dark'
              ? 'bg-slate-900/90 border-slate-700/80 text-slate-100'
              : 'bg-white/95 border-slate-200 text-slate-900'
          }`}
        >
          {/* Header with Type badge & Close */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  selectedNodeDetails.type === 'folder'
                    ? 'bg-blue-500/20 text-blue-400'
                    : selectedNodeDetails.type === 'note'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                {selectedNodeDetails.type === 'folder'
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
          <h4 className="font-semibold text-sm leading-snug line-clamp-2 mb-1.5">
            {selectedNodeDetails.icon ? `${selectedNodeDetails.icon} ` : ''}
            {selectedNodeDetails.label}
          </h4>

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
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                {selectedNodeDetails.neighbors.map((neighbor) => (
                  <button
                    key={neighbor.id}
                    type="button"
                    onClick={() => setSelectedNode(neighbor)}
                    className={`truncate max-w-[170px] rounded-md px-2 py-0.5 text-[11px] transition-colors ${
                      neighbor.type === 'folder'
                        ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                        : neighbor.type === 'note'
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                    }`}
                  >
                    {neighbor.type === 'folder' ? '📁 ' : neighbor.type === 'tag' ? '#' : '📄 '}
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
