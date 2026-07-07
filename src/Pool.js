
import * as THREE from 'three/webgpu';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from './DRACOLoader.min.js';

//https://www.utsubo.com/blog/threejs-best-practices-100-tips
//https://husong.me/ktx2-encoder/tools/

export class Pool {

	constructor( renderer ){

		this.font = null
		this.textures = {}
		this.meshs = {}

		this.ktx2 = new KTX2Loader().setPath( './assets/textures/ktx2/' ).detectSupport( renderer );
        this.ktx2.setTranscoderPath('./assets/basis/');

	}

    async postload(){

        // font

        this.font = await new FontLoader().loadAsync( './assets/font/font.json' );

        // envmap

        const hdrLoader = new HDRLoader().setPath( './assets/textures/' )

        let t = await hdrLoader.loadAsync( 'box3.hdr' );
        t.mapping = THREE.EquirectangularReflectionMapping;
        this.textures['envmap'] = t

    }

	async load(){

		// model

		const draco = new DRACOLoader()
        const glb = await new GLTFLoader().setDRACOLoader( draco ).setCrossOrigin('anonymous').loadAsync( './assets/models/backroom.glb' );

        glb.scene.traverse( ( child ) => {

            if(child.isMesh){
                child.geometry.deleteAttribute('color')
                this.meshs[child.name] = child
            }
        })

        

        //t =  await hdrLoader.loadAsync( 'assets/textures/light.hdr' );///new HDRLoader().load('assets/textures/light.hdr')
        //textures['spot'] = f

        // textures

        let t

        const loader = this.ktx2;

        t = await loader.loadAsync('wall_1.ktx2')//new THREE.TextureLoader().load( 'assets/textures/wall_1.jpg' );
        /*t.colorSpace = THREE.SRGBColorSpace;*/
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(5,5)
        t.flipY = false
        this.textures['wall_1'] = t

        t = await loader.loadAsync('wall_2.ktx2')
        //t = new THREE.TextureLoader().load( 'assets/textures/wall_2.jpg' );
        //t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(5,5)
        t.flipY = false
        this.textures['wall_2'] = t

        t = await loader.loadAsync('wall_3.ktx2')
        //t = new THREE.TextureLoader().load( 'assets/textures/wall_3.jpg' );
        //t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(5,5)
        t.flipY = false
        this.textures['wall_3'] = t

        t = await loader.loadAsync('wall_4.ktx2')
        //t = new THREE.TextureLoader().load( 'assets/textures/wall_4.jpg' );
        //t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(5,5)
        t.flipY = false
        this.textures['wall_4'] = t

        t = await loader.loadAsync('wall_5.ktx2')
        //t = new THREE.TextureLoader().load( 'assets/textures/wall_5.jpg' );
        //t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(5,5)
        t.flipY = false
        this.textures['wall_5'] = t

        t = await loader.loadAsync('wall_6.ktx2')
        //t = new THREE.TextureLoader().load( 'assets/textures/wall_6.jpg' );
        //t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(2,2)
        t.flipY = false
        this.textures['wall_6'] = t

        t = await loader.loadAsync('wall_6_n.ktx2')//new THREE.TextureLoader().load( 'assets/textures/wall_6_n.jpg' );
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(2,2)
        t.flipY = false
        this.textures['wall_6_n'] = t

        t = await loader.loadAsync('wall_6_r.ktx2')//new THREE.TextureLoader().load( 'assets/textures/wall_6_r.jpg' );
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(2,2)
        t.flipY = false
        this.textures['wall_6_r'] = t

        /*t = new THREE.TextureLoader().load( 'assets/textures/pool.png' );
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(1,1)

        textures['floor'] = t*/

        t = await loader.loadAsync('carpet_c.ktx2')//new THREE.TextureLoader().load( 'assets/textures/carpet_c.jpg' );
        //t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(1,1)

        this.textures['carpet_c'] = t

        t = await loader.loadAsync('carpet_n.ktx2')//new THREE.TextureLoader().load( 'assets/textures/carpet_n.jpg' );
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(1,1)

        this.textures['carpet_n'] = t

        t = await loader.loadAsync('carpet_r.ktx2')//new THREE.TextureLoader().load( 'assets/textures/carpet_r.jpg' );
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(1,1)

        this.textures['carpet_r'] = t

        //

        let uv = 0.128
        let d = -0.03125//22//125

        t = await loader.loadAsync('tiles_c.ktx2')//new THREE.TextureLoader().load( 'assets/textures/tiles_c.jpg' );
        //t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(uv,uv)
        t.offset.set(d,d)

        this.textures['tiles_c'] = t

        t = await loader.loadAsync('tiles_n.ktx2')//new THREE.TextureLoader().load( 'assets/textures/tiles_n.jpg' );
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(uv,uv)
        t.offset.set(d,d)

        this.textures['tiles_n'] = t

        t = await loader.loadAsync('tiles_arm.ktx2')//new THREE.TextureLoader().load( 'assets/textures/tiles_arm.jpg' );
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(uv,uv)
        t.offset.set(d,d)

        this.textures['tiles_arm'] = t

        t = await loader.loadAsync('tiles_l.ktx2')//new THREE.TextureLoader().load( 'assets/textures/tiles_l.jpg' );
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(uv,uv)
        t.offset.set(d,d)

        this.textures['tiles_l'] = t

        loader.dispose()

	}

}