import { createMulberry32Generator, type Vec3, vec3 } from 'mathcat';
import {
    addOffMeshConnection,
    createFindNearestPolyResult,
    DEFAULT_QUERY_FILTER,
    findNearestPoly,
    findRandomPoint,
    getNodeByTileAndPoly,
    type NavMesh,
    type NodeRef,
    OffMeshConnectionDirection,
    type OffMeshConnectionParams,
} from 'navcat';
import { crowd, generateTiledNavMesh, pathCorridor, type TiledNavMeshInput, type TiledNavMeshOptions } from 'navcat/blocks';
import {
    createNavMeshHelper,
    createNavMeshOffMeshConnectionsHelper,
    createNavMeshPolyHelper,
    type DebugObject,
    getPositionsAndIndices,
} from 'navcat/three';


const guiSettings = {
    showVelocityVectors: true,
    showPolyHelpers: true,
    showLocalBoundary: false,
    showObstacleSegments: false,
    showPathLine: false,
    showObstacleAvoidanceDebug: false,
    debugAgentIndex: 0,
    periodicScatter: true,
    // crowd update flags (initially all on)
    anticipateTurns: true,
    obstacleAvoidance: true,
    separation: true,
    optimizeVis: true,
    optimizeTopo: true,
};

// https://github.com/isaac-mason/navcat


export class Crowd {

	constructor(  ){

	}

}