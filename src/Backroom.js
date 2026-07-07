import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

import { getDoorsByRoomNumber } from './room/door.js';
import { generateDungeon } from './dungeon/generate.js';
import { randInt } from './utility/roll.js';
//import { formatRoomGrid } from './controller/formatter.js';


const todeg = 180 / Math.PI
const pillarGridThreshold = 6;
const pillarGridInset     = 1;

export class Backroom {

	constructor( scene, meshs, font, textures, fpsView, sound ){

		this.scene = scene;
		this.fpsView = fpsView;
		this.sound = sound;

		this.scale = 0.5//0.25

		this.config ={ 
		    items: { 
		    	itemQuantity: 'random', 
		    	itemType: 'random', 
		    	itemCondition: 'random', 
		    	itemRarity: 'random' 
		    },
		    maps:{
		    	dungeonName: 'Random backroom', 
		    	dungeonComplexity:16*this.scale, 
		    	dimentionMultiplier:8, 
		    	roomMultiplier:16*this.scale, 
		    	dungeonConnections: 12, 
		    	dungeonMaps: 1, 
		    	dungeonTraps: 5 
		    },
		    rooms:{
		    	roomType: 'random', 
		    	roomCondition: 'random', 
		    	roomSize: 'random', 
		    	roomFurnitureQuantity: 'random'
		    }
		}

		this.font = font

		this.floorMaterial = new THREE.MeshStandardMaterial({
		    color:0x9f9e6e, 
		    map:textures.carpet_c, 
		    //normalMap:textures.carpet_n, 
		    //roughnessMap:textures.carpet_r, 
		    //normalScale:new THREE.Vector2(0.5,-0.5)
		})
		this.floorMaterial_5 = this.floorMaterial.clone()
		this.floorMaterial_5.color.setHex(0x9f7155)

		this.floorMaterial_6 = this.floorMaterial.clone()
		this.floorMaterial_6.color.setHex(0x909090)

		this.roofMaterial = new THREE.MeshStandardMaterial({ 
			metalness:1, roughness:1,
			map:textures.tiles_c,
			normalMap:textures.tiles_n,
			aoMap:textures.tiles_arm,
			roughnessMap:textures.tiles_arm,
			metalnessMap:textures.tiles_arm,
			emissiveMap:textures.tiles_l,
			emissiveIntensity:1,
			//emissive:new THREE.Color( 15,15,15),
			emissive:new THREE.Color(1,1,1),
			//lightMap:textures.tiles_l,
			//lightMapIntensity:100,

		})

		this.textMaterial =new THREE.MeshStandardMaterial({color:0x333432, metalness:0.5, roughness:0.4 })

		this.meshs = meshs
		this.baseMaterial_1 = [
			new THREE.MeshStandardMaterial({map:textures.wall_1}),//color:0xACAC90
			new THREE.MeshStandardMaterial({color:0x9f9e6e}),
			this.floorMaterial,
			this.roofMaterial,
			this.textMaterial,
		]

		this.baseMaterial_2 = [
			new THREE.MeshStandardMaterial({map:textures.wall_2}),//color:0xACAC90
			new THREE.MeshStandardMaterial({color:0x737462}),
			this.floorMaterial,
			this.roofMaterial,
			this.textMaterial,
		]

		this.baseMaterial_3 = [
			new THREE.MeshStandardMaterial({map:textures.wall_3}),//color:0xACAC90
			new THREE.MeshStandardMaterial({color:0xada670}),
			this.floorMaterial,
			this.roofMaterial,
			this.textMaterial,
		]

		this.baseMaterial_4 = [
			new THREE.MeshStandardMaterial({map:textures.wall_4}),//color:0xACAC90
			new THREE.MeshStandardMaterial({color:0xacac90}),
			this.floorMaterial,
			this.roofMaterial,
			this.textMaterial,
		]

		this.baseMaterial_5 = [
			new THREE.MeshStandardMaterial({map:textures.wall_5}),//color:0xACAC90
			new THREE.MeshStandardMaterial({color:0xa3a891}),
			this.floorMaterial_5,
			this.roofMaterial,
			this.textMaterial,
		]

		this.baseMaterial_6 = [
			new THREE.MeshStandardMaterial({
			map:textures.wall_6,
			normalMap:textures.wall_6_n,
			roughnessMap:textures.wall_6_r,
			}),//color:0xACAC90
			new THREE.MeshStandardMaterial({color:0xbab397}),
			this.floorMaterial_6,
			this.roofMaterial,
			this.textMaterial,
		]

		this.baseMaterial_7 = [
			new THREE.MeshStandardMaterial({color:0xa9a162}),//color:0xACAC90a9a778
			new THREE.MeshStandardMaterial({color:0xa9a162}),
			new THREE.MeshStandardMaterial({color:0xa9a162}),
			new THREE.MeshStandardMaterial({color:0xa9a162, emissiveMap:textures.tiles_l, emissiveIntensity:1, emissive:new THREE.Color( 1,1,1)}),
			this.textMaterial,
		]

		this.wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe:true, color:0xff8000 })

		this.startPosition = new THREE.Vector3()
		this.startDirection = 'north'
		this.group = new THREE.Group()

	}

	preGenerate(){

		this.dungeon = generateDungeon(this.config);
		this.doorbyRoom = getDoorsByRoomNumber(this.dungeon.doors)
		this.dimensions = this.dungeon.dimensions

	}

	generate( intro = false ){

		this.sound.clear()

		this.dispose();

		this.fullQuad = false;
		this.fullGeometry = []
		this.roomDoorId = []

		if( !intro ){
			this.dungeon = generateDungeon(this.config);
			this.doorbyRoom = getDoorsByRoomNumber(this.dungeon.doors)
			this.dimensions = this.dungeon.dimensions
		}

		this.group.position.x = - this.dimensions.width
		this.group.position.z = - this.dimensions.height

		this.dungeon.doors.map((door) => {

			this.dispatchDoor( door, this.dungeon.rooms )
	        
	    });

		this.dungeon.rooms.map((room) => {

			this.buildRoom( room )
	        
	    });

	    // compact to group 

	    this.roomToMesh()

	    this.fpsView.setLevel( this.collisionMesh, this.startPosition, this.startDirection, false );

	    this.scene.add(this.group);

	}

	dispose(){

		if(!this.group.parent) return

		if(this.collisionMesh) this.collisionMesh.geometry.dispose()

	    let j = this.group.children.length, m
	    while(j--){
	    	m = this.group.children[j]
	    	
	    	this.group.remove(m)
	    	if(m.geometry) m.geometry.dispose()
	    	else console.log(m)
	    	
	    }

	    /*for(let i in this.baseMaterial){
	    	this.baseMaterial[i].dispose()
	    }*/

	    this.group.parent.remove(this.group)

	}

	getDirection( wall, rectangle ){

		if (wall.y === (rectangle.y - 1)) return 'north';
	    if (wall.x === (rectangle.x + rectangle.width)) return 'east';
	    if (wall.y === (rectangle.y + rectangle.height)) return 'south';
	    if (wall.x === (rectangle.x - 1)) return 'west';
	    
	}

	dispatchDoor( door, rooms ){

		let { type, connect } = door;
		let a = Number(Object.keys(connect)[0]);
		let b = Number(Object.keys(connect)[1]);

		let n;
		if( a!==0 )n = a;
		else n = b;

		if(a===0 || b===0) door.isEnter = true

		//console.log( type, n )

		let dir = connect[n].direction;
	    if( dir === 'east' || dir === 'west' ) door.isRotate = true
	    //door.roomNumber = n

	    /*if(!rooms[n]){
	    	console.log('fail door', n, a , b)
	    	return
	    }*/

		if(!this.roomDoorId[n]) this.roomDoorId[n] = []
		this.roomDoorId[n].push(door)

	}

	buildDoor( door, roomGeomerty ){

		let { rectangle, type, locked, connect } = door;

		let s = rectangle.width;
		if( rectangle.height > s ) s = rectangle.height

		let name, g;
	    let rotate = door.isRotate;
	    let start = door.isEnter;

	    if( start ){ 
	    	let px = rectangle.x+(rectangle.width*0.5)
	    	let pz = rectangle.y+(rectangle.height*0.5)
	    	this.startPosition.set( px*2, 0, pz*2 ).add(this.group.position)
	    	this.startDirection = door.connect[0].direction
	    	
	    	if(type === 'hole') type = 'archway';
	    }

	    //console.log( type, door.roomNumber )

	    if(type==='hole') name = 'hole_' + s
		else if(type==='archway') name = 'arch_' + s 
	    else name = 'door_' + s

	    if(this.meshs[name + '_1']){
	    	g = this.meshs[name + '_1'].geometry.clone()
			if(rotate) g.rotateY( -Math.PI*0.5 )
			g.translate((rectangle.x+0.5)*2, 0, (rectangle.y+0.5)*2)
		    roomGeomerty.wall.push(g)
	    }

	    if(this.meshs[name + '_2']){
	    	g = this.meshs[name + '_2'].geometry.clone()
			if(rotate) g.rotateY( -Math.PI*0.5 )
			g.translate((rectangle.x+0.5)*2, 0, (rectangle.y+0.5)*2)
		    roomGeomerty.border.push(g)
	    }

	    if(this.meshs[name + '_3']){
	    	g = this.meshs[name + '_3'].geometry.clone()
			if(rotate) g.rotateY( -Math.PI*0.5 )
			g.translate((rectangle.x+0.5)*2, 0, (rectangle.y+0.5)*2)
		    roomGeomerty.floor.push(g)
	    }

	    if(this.meshs[name + '_4']){
	    	g = this.meshs[name + '_4'].geometry.clone()
			if(rotate) g.rotateY( -Math.PI*0.5 )
			g.translate((rectangle.x+0.5)*2, 0, (rectangle.y+0.5)*2)
		    roomGeomerty.roof.push(g)
	    }


	}


	buildRoom( room ){

		let { rectangle, traps, walls } = room;

		const roomGeomerty = {
			wall:   [],
			border: [],
			floor:  [],
			roof:   [],
			text:   [],
			trap:   [],
		}

		let g, i, j, k, uv
		let n = room.roomNumber
		let name = room.config.roomType
		if(name === 'room') name = ''
		if(name === 'hallway') name = ''
		let door = this.doorbyRoom[n]

		let center = { x:rectangle.x+(rectangle.width*0.5), y:rectangle.y+(rectangle.height*0.5)}
		roomGeomerty['center'] = center 

		let radius = rectangle.width;
		if( rectangle.height > radius ) radius = rectangle.height
		

		// door way

		let avoid = [], rec, w, h
		for(let j in door){

			rec = door[j].rectangle
			w = rec.width
			h = rec.height

			avoid.push([rec.x,rec.y])
			if(w>1) avoid.push([rec.x+1,rec.y])
			if(w>2) avoid.push([rec.x+2,rec.y])
			if(w>3) avoid.push([rec.x+3,rec.y])

			if(h>1) avoid.push([rec.x,rec.y+1])
			if(h>2) avoid.push([rec.x,rec.y+2])
			if(h>3) avoid.push([rec.x,rec.y+3])

		}

	    // pillar 

	    let roomPillarType = randInt(1,2)
	    let fullPillarRoom = randInt(0,6)

	    let isFloorHole = false
	    let floorHolePosition = []


	    if( rectangle.width > pillarGridThreshold && rectangle.height > pillarGridThreshold) {

	    	isFloorHole = randInt(0,3) === 3 ? true : false 

	    	let innerWidth  = rectangle.width  - (pillarGridInset * 2);
		    let innerHeight = rectangle.height - (pillarGridInset * 2);

		    let x = rectangle.x
		    let y = rectangle.y

		    let pos = [
			    { x: (x + pillarGridInset), y: (y + pillarGridInset) },
			    { x: (x + innerWidth),      y: (y + pillarGridInset) },
			    { x: (x + pillarGridInset), y: (y + innerHeight) },
			    { x: (x + innerWidth),      y: (y + innerHeight) }
		    ]

		    if( fullPillarRoom === 6 ){

		    	let space = roomPillarType === 1 ? 3 : 2 
		    	let dx = Math.floor( rectangle.width / space )
		    	let dy = Math.floor( rectangle.height / space )
		    	pos = []

		    	for(let i = 0; i<dx; i++){
		    		for(let j = 0; j<dy; j++){

		    			let addPillard = randInt(0,20)

		    			if(addPillard<20) pos.push( { 
		    				x:(x + pillarGridInset) + (i*space) , 
		    				y:(y + pillarGridInset) + (j*space) 
		    			})
		    		
		    	    }
		    	}

		    }

		    let pName = 'pillar_' + roomPillarType

		    for(let p in pos){

		    	if(isFloorHole){
		    		
		    		g = this.meshs['floor_2'].geometry.clone()
			    	g.translate((pos[p].x+0.5)*2, 0, (pos[p].y+0.5)*2)
			    	roomGeomerty.floor.push(g)
			    	floorHolePosition.push({ x:pos[p].x, y:pos[p].y })

		    	} else {
		    		g = this.meshs[pName + '_1'].geometry.clone()
			    	g.translate((pos[p].x+0.5)*2, 0, (pos[p].y+0.5)*2)
			    	roomGeomerty.wall.push(g)

			    	g = this.meshs[pName + '_2'].geometry.clone()
			    	g.translate((pos[p].x+0.5)*2, 0, (pos[p].y+0.5)*2)
			    	roomGeomerty.border.push(g)
		    	}
		    	
		    }
	        
	    }

	    // doors

	    if(this.roomDoorId[n]){
	    	for(let i in this.roomDoorId[n]){
	    		this.buildDoor( this.roomDoorId[n][i], roomGeomerty )
	    	}
	    }

	    // walls

	    //console.log(walls)

	    let firstWall = true
	    let textWall = {}
	    let r = 0

		for(let i in walls){

			w = walls[i]

			let adding = true
			let glitchBorder = randInt(1, 50) > 48 ? true : false

			for(let k in avoid){
				if(w.x === avoid[k][0] && w.y === avoid[k][1]) adding = false
			}

			if(adding){

				let dir = this.getDirection( w, rectangle )
				r = 0
				if(dir === 'south') r = -Math.PI
				if(dir === 'west') r = Math.PI*0.5
				if(dir === 'east') r = -Math.PI*0.5 

				if( firstWall ) {
					firstWall = false
					textWall = { x:(w.x+0.5)*2, y:(w.y+0.5)*2, r:r, dir:dir }
				} else {
					if( randInt(1, 10) === 10 && !glitchBorder ) textWall = { x:(w.x+0.5)*2, y:(w.y+0.5)*2, r:r, dir:dir }
				}

				let wName = 'wall_' + 1

				g = this.meshs[wName + '_1'].geometry.clone()
				g.rotateY( r ) 
				g.translate((w.x+0.5)*2, 0, (w.y+0.5)*2)
			    roomGeomerty.wall.push(g)

			    g = this.meshs[wName + '_2'].geometry.clone()
				g.rotateY( r ) 
				g.translate((w.x+0.5)*2, glitchBorder ? (randInt(1, 6) * 0.5)-0.12 :0, (w.y+0.5)*2)
			    roomGeomerty.border.push(g)

			}
        }

		// floor 

		let dw = this.fullQuad ? rectangle.width : 1;
		let dh = this.fullQuad ? rectangle.height : 1;

		if( isFloorHole ){
			//g = new THREE.PlaneGeometry(2, 2, 1, 1 )
			//g.rotateX(-Math.PI*0.5)
			let vx, vy, fg
			
			for(let i = 0; i<rectangle.width; i++){
	    		for(let j = 0; j<rectangle.height; j++){

	    			vx = rectangle.x + i
	    			vy = rectangle.y + j

	    			let adding = true

	    			for(let k = 0; k<floorHolePosition.length; k++){
	    				if(floorHolePosition[k].x === vx && floorHolePosition[k].y === vy ) adding = false
	    			}

	    			if(adding){
	    				fg = this.meshs['floor_0'].geometry.clone()//g.clone()
	    				fg.translate((vx+0.5)*2, 0, (vy+0.5)*2)
	    				roomGeomerty.floor.push(fg)
	    			} 

	    		
	    	    }
	    	}

		} else {

			//g = new THREE.PlaneGeometry(rectangle.width*2, rectangle.height*2, dw, dh )
			//g.rotateX(-Math.PI*0.5)
			g = this.meshs['floor_0'].geometry.clone()
			g.scale( rectangle.width, 1, rectangle.height )
			g.translate(center.x*2, 0, center.y*2)
			//g.group = 2;
			uv = g.attributes.uv.array
			k = g.attributes.uv.count
			while(k--){ 
				uv[k*2] *= rectangle.width
				uv[(k*2)+1] *= rectangle.height
			}
			roomGeomerty.floor.push(g)

		}

		

		// roof
		//g = new THREE.PlaneGeometry(rectangle.width*2, rectangle.height*2, dw, dh )
		//g.rotateX(Math.PI*0.5)
		g = this.meshs['floor_0'].geometry.clone()
		g.rotateX(Math.PI)
		g.scale( rectangle.width, 1, rectangle.height )
		g.translate(center.x*2, 3, center.y*2)
		//g.group = 3;
		uv = g.attributes.uv.array
		k = g.attributes.uv.count
		while(k--){ 
			uv[k*2] *= rectangle.width
			uv[(k*2)+1] *= rectangle.height
		}
		roomGeomerty.roof.push(g)


		

		// text
		this.createLabel( n.toString(), name, {x:center.x*2, y:0, z:center.y*2}, traps, roomGeomerty, textWall )

		// pool 
		this.fullGeometry.push( roomGeomerty )

		//sound
		let withSound = randInt(0,3) > 1 ? true : false
		if(room.config.roomType === 'hallway') withSound = false
		if(withSound){
			let n = randInt(0,14)
			this.sound.add('atmo_'+n, [(center.x*2)- this.dimensions.width, 1, (center.y*2)- this.dimensions.height], radius*0.5)
		}

	}



	createLabel( num, name, position, traps, roomGeomerty, textWall ) {

		let txt = num
		if(name) txt = num + ' ' + name

		let g = new TextGeometry( txt, {
			font: this.font,
			size: name ? 0.2:0.4,
			depth: traps === undefined ? 0.02 : 0.04,
			curveSegments: 12,
			bevelEnabled: false
		});


		g.computeBoundingBox();
		let offx = - 0.5 * ( g.boundingBox.max.x - g.boundingBox.min.x );
		let offy = name ? -0.1:-0.2//- 0.5 * ( g.boundingBox.max.y - g.boundingBox.min.y );
		let offz = - 0.5 * ( g.boundingBox.max.z - g.boundingBox.min.z );


		//g.rotateX(-Math.PI*0.5)
		//g.translate( offx+position.x, offy+position.y, offz+position.z );

		let dx = 0
		let dy = 0

		if(textWall.dir === 'south') {dy = -1; offz = 0}
		if(textWall.dir === 'north') {dy = 1; offz = 0}

		if(textWall.dir === 'west') {dx = 1; offx = 0}
		if(textWall.dir === 'east') {dx = -1; offx = 0}

		g.rotateY(textWall.r)
		g.translate( offx+textWall.x+dx, offy+1, offz+textWall.y+dy );
		
		g.deleteAttribute('color')

		g = new mergeVertices( g )
		roomGeomerty.text.push(g)
	
	}

	roomToMesh() {

		let collisionGeometry = []
		let navGeometry = []

		let i = this.fullGeometry.length, data, g
		let noBorder

		let tWall, tFloor

		while(i--){

			noBorder = randInt(1, 10) === 10 ? true : false

			data = this.fullGeometry[i];
			let geometry = []

			g = new mergeGeometries( data.wall, false )
			g = mergeVertices(g)
			g.group = 0
			tWall = g.clone()
			geometry.push(g)


			g = new mergeGeometries( data.border, false )
			g = mergeVertices(g)
			g.group = 1
			if(noBorder) g.translate(0,-0.2,0)
			geometry.push(g)
			
			g = new mergeGeometries( data.floor, false )
			g.group = 2
			tFloor = g.clone()
			geometry.push(g)
		
		
			g = new mergeGeometries( data.roof, false )
			g.group = 3
			geometry.push(g)
			

			if( data.text.length!==0 ){
				g = new mergeGeometries( data.text, false )
				g.group = 4
				geometry.push(g)
			} 

			collisionGeometry.push( tWall, tFloor )
			navGeometry.push( tFloor )

			let finalGeo = new mergeGeometries( geometry, true )
			finalGeo.translate( -data.center.x*2, 0, -data.center.y*2 );
	        finalGeo.computeBoundingBox()
	        finalGeo.computeBoundingSphere()

	        // clear
			for(let m in data){
				let k = data[m].length
				if(k){
					while(k--) data[m][k].dispose()
					data[m] = []
				}

				k = geometry.length
				if(k){
					while(k--) geometry[k].dispose()
					geometry = []
				}
			}


	        let v = randInt(1, 7)
	        let mesh = new THREE.Mesh( finalGeo, this[ 'baseMaterial_'+ v ] )
	      
	        mesh.position.set(data.center.x*2, 0, data.center.y*2)
	        mesh.name = 'room' + i;
	        mesh.castShadow = false;
	        mesh.receiveShadow = true;
	        this.group.add(mesh)

		}

		// collision mesh

		let collisionGeo = new mergeGeometries( collisionGeometry, false )
		collisionGeo.translate(-this.dimensions.width, 0, -this.dimensions.height)
		this.collisionMesh = new THREE.Mesh( collisionGeo, this.wireframeMaterial )
		
		// navigation mesh

		let navGeo = new mergeGeometries( navGeometry, false )
		navGeo.translate(-this.dimensions.width, 0, -this.dimensions.height)
		this.navMesh = new THREE.Mesh( navGeo, this.wireframeMaterial )

		i = collisionGeo.length
		while(i--) collisionGeo[i].dispose()
		collisionGeo = []

	    i = navGeometry.length
		while(i--) navGeometry[i].dispose()
		navGeometry = []
				
		this.fullGeometry = []

	}

}