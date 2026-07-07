import * as THREE from 'three/webgpu';

import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { Capsule } from 'three/addons/math/Capsule.js'
import { CapsuleHelper } from './helpers/CapsuleHelper.js'
import { RayHelper } from './helpers/RayHelper.js'


const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const GRAVITY = 30;
const MinY = -25;
const pi90 = Math.PI*0.5
const pi = Math.PI

const DELTA_SPEED = 10
const DELTA_JUMP = 5
const WALK_SPEED = 1
const RUN_SPEED = 3

const NUM_SPHERES = 500;
const SPHERE_RADIUS = 0.2;

const STEPS_PER_FRAME = 5;

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

const tmpMatrix = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpQuat2 = new THREE.Quaternion();
const tmpPosition = new THREE.Vector3();
const tmpScale = new THREE.Vector3();

const Key = {};

export class FpsView {

	constructor( container, scene, camera, textures ){

		this.envFollow = true

		this.radius = 0.35
		this.height = 1.0

		this.container = container
		this.scene = scene;
		this.camera = camera
		this.isCrouch = false

		//this.camera.order = 100000

		this.useRayCast = false

		this.worldOctree = new Octree();

		this.playerTarget = new THREE.Vector3();
		this.camDecal = new THREE.Vector3(0,1,0)
		this.playerSpherical = new THREE.Spherical( 0.0001, Math.PI*0.5, 0 );
		this.targetSpherical = new THREE.Spherical( 0.0001, Math.PI*0.5, 0 );

		

		this.playerMesh = new CapsuleHelper(this.radius, this.height );
		this.playerMesh.visible = false
		this.playerCollider = new Capsule( new THREE.Vector3( 0, this.radius, 0 ), new THREE.Vector3( 0, this.height, 0 ), this.radius );
		scene.add( this.playerMesh );

		this.playerVelocity = new THREE.Vector3();
		this.playerDirection = new THREE.Vector3();

		this.playerOnFloor = false;
		this.mouseTime = 0;
		this.playerSpeed = 0;
		this.lastTime = 0;
		this.isMouseLock = false;
		this.enabled = true;


		if(this.useRayCast){

			this.playerRaycaster = new THREE.Raycaster();
			this.playerRaycaster.ray.max = this.radius * 2; 
			this.playerRaycaster.ray.direction.set( 0, -1, 0 );

			this.playerRaycasterHelper = new RayHelper( this.playerRaycaster );
			scene.add( this.playerRaycasterHelper );

		}

		/*const pointLight = new THREE.PointLight( '#FF0000', 1000 );
        pointLight.position.set( 0, 0, 0 );
        pointLight.distance = 10;
        pointLight.castShadow = true;
        pointLight.shadow.mapSize.width = 1024;
        pointLight.shadow.mapSize.height = 1024;
        pointLight.shadow.radius = 20;
        this.playerMesh.add( pointLight );*/

		let spotLight = new THREE.SpotLight( 0xffffff, 50 );
		//spotLight.name = 'spotLight';
		//spotLight.map = textures.spot;
		spotLight.position.set( 0, 0, 0 );
		spotLight.target.position.set( 0, 0, -2)
		spotLight.angle = Math.PI / 3;
		spotLight.penumbra = 1;
		spotLight.decay = 1//2;
		spotLight.distance = 0;
		//spotLight.order = 100000
		//console.log(spotLight)
		//spotLight.userData.helper = new THREE.SpotLightHelper( spotLight );
		
		/*spotLight.castShadow = true;
		spotLight.shadow.mapSize.width = 1024;
		spotLight.shadow.mapSize.height = 1024;
		spotLight.shadow.camera.near = 2;
		spotLight.shadow.camera.far = 10;
		spotLight.shadow.focus = 1;
		spotLight.shadow.intensity = 1;*/

		this.camera.add( spotLight );
		this.camera.add( spotLight.target );
		//this.playerMesh.add( spotLight.userData.helper );
		this.spotLight = spotLight

		this.ready = false;
		this.eventReady = false;

	}

	setLevel( level, startposition, starDirection, debug ){

		if(this.helper){ 
			this.scene.remove(this.helper)
			this.helper.dispose()
		}

		this.worldOctree.clear()
		this.worldOctree.fromGraphNode( level );

		if(this.useRayCast){
			this.level = level
			this.scene.add( this.level );
		}

		this.startposition = startposition;
		this.starDirection = starDirection
		
		//this.level.visible = false
		this.teleport( this.startposition, this.starDirection )

		this.ready = true

		this.initEvent()

		if(debug){
			this.helper = new OctreeHelper( this.worldOctree );
			this.scene.add( this.helper );
		}

	}

	debug(b){
		this.playerMesh.visible = b
	}

	//

	initEvent(){

		if(this.eventReady) return

		this._move = this.move.bind(this)
		this._down = this.down.bind(this)
		this._wheel = this.wheel.bind(this)

		this._keyDown = this.keyDown.bind(this)
		this._keyUp = this.keyUp.bind(this)

		document.addEventListener( 'keydown', this._keyDown, false );
		document.addEventListener( 'keyup', this._keyUp, false );

		document.addEventListener( 'pointerlockchange', ( e ) => {

			//hideInterface(document.pointerLockElement);

		});

		this.container.addEventListener( 'pointerdown', this._down );
		document.body.addEventListener( 'pointermove', this._move );
		document.addEventListener( 'wheel',this._wheel);

		/*document.addEventListener( 'pointerdown', ( e ) => {

			if ( document.pointerLockElement !== null ) ballInterval = setInterval( throwBall, 100 );
			
		});*/

		/*document.addEventListener( 'pointerup', ( e ) => {

			if ( document.pointerLockElement !== null ) clearInterval( ballInterval )
			
		});*/

		

		/* ( e ) => {

			;

		});*/

		this.eventReady = true

	}

	keyDown(e){

		if( e.code === 'KeyC' ) this.toggleCrouch()
		Key[ e.code ] = true;
 
	}

	keyUp(e){

		Key[ e.code ] = false;

	}

	down(e){

		if(!this.enabled) return

		if ( document.pointerLockElement === null ) { document.body.requestPointerLock(); }
		
	}

	up(e){

	}

	wheel(e){

		if(!this.enabled) return

		this.targetSpherical.radius += e.deltaY * 0.001;
		this.targetSpherical.radius = clamp( this.targetSpherical.radius, 0.0001, 4 );
		this.playerMesh.visible = this.targetSpherical.radius > 1
	}

	move(e){

		if ( document.pointerLockElement === document.body ) {

			/*this.playerSpherical.phi -= e.movementY / 500;
			this.playerSpherical.theta -= e.movementX / 500;
			this.playerSpherical.phi = clamp(this.playerSpherical.phi, 0.0001, Math.PI );*/

			this.targetSpherical.phi -= e.movementY / 500;
			this.targetSpherical.theta -= e.movementX / 500;
			this.targetSpherical.phi = clamp(this.targetSpherical.phi, 0.0001, Math.PI );
		}
	}

	//

	update( delta ){

		if(!this.ready) return

		let i = STEPS_PER_FRAME;
		const deltaTime = delta / STEPS_PER_FRAME;

		while(i--) {

			this.controls( deltaTime );

			this.updatePlayer( deltaTime );

			//this.updateSpheres( deltaTime );
		}

	}

	controls( deltaTime ){

		// gives a bit of air control
		const speedDelta = deltaTime * ( this.playerOnFloor ? DELTA_SPEED : DELTA_JUMP );

		let moving = false;
		let speedUp = false;
		//let crouch = false;

		if ( Key[ 'KeyW' ] || Key[ 'KeyZ' ]) {

			this.playerVelocity.add( this.getForwardVector().multiplyScalar( speedDelta ) );
			moving = true;

		}

		if ( Key[ 'KeyS' ] ) {

			this.playerVelocity.add( this.getForwardVector().multiplyScalar( - speedDelta ) );
			moving = true;

		}

		if ( Key[ 'KeyA' ] || Key[ 'KeyQ' ]) {

			this.playerVelocity.add( this.getSideVector().multiplyScalar( - speedDelta ) );
			moving = true;

		}

		if ( Key[ 'KeyD' ] ) {

			this.playerVelocity.add( this.getSideVector().multiplyScalar( speedDelta ) );
			moving = true;

		}

		if ( Key[ 'ShiftLeft' ] ) {

			speedUp = true;

		}

		if ( this.playerOnFloor ) {

			if ( Key[ 'Space' ] ) {

				this.playerVelocity.y = 9//15;
				moving = true;

			}

		} else {
			moving = true;
		}

		//this.playerCollider.end.y = this.isCrouch ? this.radius : this.height 

		this.playerSpeed = moving ? ( speedUp ? WALK_SPEED : RUN_SPEED ) : 8

	}

	toggleCrouch(){

		this.isCrouch = !this.isCrouch
		this.playerCollider.end.y = this.isCrouch ? this.radius : this.height

	}

	playerCollisions() {

		const result = this.worldOctree.capsuleIntersect( this.playerCollider );

		this.playerOnFloor = false;

		if ( result ) {

			this.playerOnFloor = result.normal.y > 0;

			if ( ! this.playerOnFloor ) {

				this.playerVelocity.addScaledVector( result.normal, - result.normal.dot( this.playerVelocity ) );

			}

			if ( result.depth >= 1e-10 ) {

				this.playerCollider.translate( result.normal.multiplyScalar( result.depth ) );

			}

		}

	}

	updatePlayer( deltaTime ) {


		if(this.playerMesh.position.y < -100) {
			this.teleport( this.startposition, this.starDirection )
		}



	    this.playerSpherical.phi = lerp(this.playerSpherical.phi, this.targetSpherical.phi, deltaTime*10)
	    this.playerSpherical.theta = lerp(this.playerSpherical.theta, this.targetSpherical.theta, deltaTime*10)
	    this.playerSpherical.radius = lerp(this.playerSpherical.radius, this.targetSpherical.radius, deltaTime*10)

	    if(this.envFollow) this.scene.environmentRotation.y = this.playerSpherical.theta - pi 

		//let damping = Math.exp( - 4 * deltaTime ) - 1;
		let damping = Math.exp( - this.playerSpeed * deltaTime ) - 1;

		if ( ! this.playerOnFloor ) {

			this.playerVelocity.y -= GRAVITY * deltaTime;

			// small air resistance
			damping *= 0.1;

		}

		this.playerVelocity.addScaledVector( this.playerVelocity, damping );

		const deltaPosition =this.playerVelocity.clone().multiplyScalar( deltaTime );
		this.playerCollider.translate( deltaPosition );

		this.playerCollisions();

		this.upCamera();

		this.playerMesh.rotation.y = this.playerSpherical.theta;
		//playerMesh.position.copy( playerCollider.end );
		//p = playerCollider.start.copy()
		this.playerMesh.position.copy( this.playerCollider.start );
		this.playerMesh.position.y += this.radius;

		// cast bottom ray

		/*this.playerRaycaster.ray.origin.copy( this.playerCollider.start )
		const intersects = this.playerRaycaster.intersectObject( this.level );
		if ( intersects.length > 0 && intersects[ 0 ].distance < this.playerRaycaster.ray.max ) {
			
			this.playerRaycaster.ray.hit = intersects[ 0 ];
			/*playerRaycaster.ray.distance = intersects[ 0 ].distance;
			playerRaycaster.ray.normal = intersects[ 0 ].face.normal;
			playerRaycaster.ray.point = intersects[ 0 ].point;
			playerRaycaster.ray.name = intersects[ 0 ].object.name;*/

		/*} else {
			this.playerRaycaster.ray.hit = false;
		}*/

	}

	getForwardVector() {

		this.camera.getWorldDirection( this.playerDirection );
		this.playerDirection.y = 0;
		this.playerDirection.normalize();
		return this.playerDirection;

	}

	getSideVector() {

		this.camera.getWorldDirection( this.playerDirection );
		this.playerDirection.y = 0;
		this.playerDirection.normalize();
		this.playerDirection.cross( this.camera.up );
		return this.playerDirection;

	}

	teleport( pos = {x:0, y:0, z:0}, direction ){

		let t = 0
		

		switch(direction){
			case 'south': t = Math.PI; break;
			case 'west': t = Math.PI*0.5; break;
			case 'east': t = -Math.PI*0.5; break;
		}

		this.playerSpherical.phi = Math.PI*0.5;
		this.playerSpherical.theta = t

		this.playerCollider.start.set( pos.x, pos.y+this.radius, pos.z );
		this.playerCollider.end.set( pos.x, pos.y+this.height, pos.z );
		this.playerCollider.radius = this.radius;

		this.playerMesh.position.copy( this.playerCollider.start );
		this.playerMesh.position.y += this.radius;
		this.playerMesh.rotation.y = t;

		if(this.envFollow) this.scene.environmentRotation.y = this.playerSpherical.theta - pi 

		this.upCamera()

		this.targetSpherical.copy(this.playerSpherical)

	}

	upCamera(){

		if(!this.enabled) return

		this.playerTarget.copy( this.playerCollider.end );
		this.camera.position.setFromSpherical( this.playerSpherical ).add( this.playerTarget );
		this.camera.lookAt( this.playerTarget );

	}

}