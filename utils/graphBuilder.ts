/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RepoFileTree, DataFlowGraph, D3Node, D3Link } from '../types';

/**
 * Converts a RepoFileTree array into a DataFlowGraph for D3 visualization.
 * Creates a hierarchical graph based on folder structure.
 */
export function buildGraphFromFileTree(repoName: string, fileTree: RepoFileTree[]): DataFlowGraph {
  const nodes: D3Node[] = [];
  const links: D3Link[] = [];
  const nodeMap = new Map<string, D3Node>();

  // Create root node
  const rootNode: D3Node = {
    id: 'root',
    label: repoName,
    group: 0
  };
  nodes.push(rootNode);
  nodeMap.set('root', rootNode);

  // Track directories and files
  const directories = new Map<string, D3Node>();
  let groupCounter = 1;

  // Process each file in the tree
  fileTree.forEach((file, index) => {
    const pathParts = file.path.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const dirPath = pathParts.slice(0, -1).join('/');

    // Create or get directory nodes
    let parentId = 'root';
    let currentPath = '';
    
    pathParts.slice(0, -1).forEach((part, i) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (!directories.has(currentPath)) {
        const dirNode: D3Node = {
          id: `dir-${currentPath}`,
          label: part,
          group: groupCounter++
        };
        nodes.push(dirNode);
        directories.set(currentPath, dirNode);
        
        // Link to parent
        links.push({
          source: parentId,
          target: dirNode.id,
          value: 2
        });
      }
      parentId = `dir-${currentPath}`;
    });

    // Create file node
    const fileNode: D3Node = {
      id: `file-${index}`,
      label: fileName,
      group: groupCounter % 10
    };
    nodes.push(fileNode);
    nodeMap.set(file.path, fileNode);

    // Link file to its parent directory (or root if top-level)
    links.push({
      source: parentId,
      target: fileNode.id,
      value: 1
    });
  });

  return { nodes, links };
}
