import * as THREE from 'three';


export class Sound  {

    constructor( scene, camera ){

    	this.mat = new THREE.MeshBasicMaterial({color:0xff0000, wireframe:true })

    	this.listener = new THREE.AudioListener();
    	camera.add( this.listener );

    	//this.master = this.listener.getMasterVolume();

    	//console.log(this.master)

    	this.scene = scene;
    	this.audioLoader = new THREE.AudioLoader().setPath('./sounds/')

    	this.audioName = [
    	    'atmo_0', 'atmo_1', 'atmo_2', 'atmo_3', 'atmo_4',
    	    'atmo_5', 'atmo_6', 'atmo_7', 'atmo_8', 'atmo_9',
    	    'atmo_10', 'atmo_11', 'atmo_12', 'atmo_13', 'atmo_14'
    	]

    	this.audio = {}
    	this.mapSound = []

    }

    setVolume(v){

    	this.listener.getMasterVolume(v);
    
    }

    async load(){

    	for( let i = 0; i<this.audioName.length; i++ ){

			name = this.audioName[i];
			this.audio[name] = this.audioLoader.loadAsync( name + '.mp3' );

		}

		const pendings = Object.values( this.audio );
		await Promise.all( pendings );

		for ( const name in this.audio ) {
			this.audio[ name ] = await this.audio[ name ];
		}

		//console.log('sound load !', this.audio)

    }

    clear(){

    	let i = this.mapSound.length
    	while(i--){
    		this.mapSound[i].stop()
    		this.scene.remove(this.mapSound[i])
    	}

    	this.mapSound = [];

    }

    add( name, position, radius ){

		const sound = new THREE.PositionalAudio(this.listener)
		sound.setVolume(0.25)
		sound.setBuffer(this.audio[ name ])
		sound.setLoop(true)
		sound.setRefDistance(radius)
		sound.setDistanceModel('exponential')

		sound.position.fromArray(position)
		this.scene.add(sound)
		sound.updateMatrixWorld()
		setTimeout( ()=>{ sound.play() }, 1000 ) 

		/*let g = new THREE.SphereGeometry(radius)
		let m = new THREE.Mesh(g, this.mat)
		m.position.fromArray(position)
		this.scene.add(m)*/

		this.mapSound.push(sound)

		

    }

    stepSound(){

    	let stepsSound = this.stepsSound

    	this.audioLoader.load("audio/steps.wav", buffer => {
			stepsSound = new THREE.PositionalAudio(window.listener)
			stepsSound.position.set(this.envMapSize.x - 8, 7, -this.envMapSize.z + 0.75)
			this.scene.add(stepsSound)
			stepsSound.updateMatrixWorld()

			stepsSound.setVolume(0.25)
			stepsSound.setBuffer(buffer)
			stepsSound.setRefDistance(17)
		})

		setTimeout(() => {
			stepsSound.play()

			setInterval(() => {
				setTimeout(() => {
					stepsSound.stop().play()

					stepsSound.position.set(
						2 * this.envMapSize.x * Math.random() - this.envMapSize.x,
						7,
						2 * this.envMapSize.z * Math.random() - this.envMapSize.z
					)
				}, Math.random() * 12500 + 3000)
			}, 20000)
		}, 5000 + 7000 * Math.random())

    }

}