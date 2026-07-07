import * as UIL from './uil.module.min.js';


export class Gui {

	constructor(){

        this.isHide = true

    	let ui = new UIL.Gui( { w:256, h:26, close:false, autoShow:false, css:'top:30px; right:10px;' } )
        ui.hide(this.isHide);
        

        this.ui = ui;

    }

    display(){

        this.isHide = !this.isHide
        this.ui.hide(this.isHide);


    }

    init( backroom, switchView ){

        let b = document.createElement( 'div' );
        let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; cursor:pointer; ';

        b.style.cssText = unselectable + 'position:absolute; top:5px; right:10px; font-size:16px; color:rgba(255,255,255,0.4);'
        b.innerHTML = '✚'
        document.body.appendChild( b );

        b.addEventListener('pointerdown', this.display.bind(this) )
        b.addEventListener('pointerover', ()=>{ b.style.color = 'rgba(255,255,255,1)' } )
        b.addEventListener('pointerout', ()=>{ b.style.color = 'rgba(255,255,255,0.4)' } )

        let ui = this.ui

        
        let gr = ui.add('group', { name:'backroom', open:false, h:30 })
        gr.add('bool', { name:'GLOBAL VIEW', onName:'FPS VIEW', mode:1}).onChange( switchView )
        gr.add('empty', {h:3})
        gr.add('button', { name:'GENERATE' }).onChange( ()=>{ backroom.generate() } )
        gr.add('empty', {h:3})
        
        gr.add( backroom.config.maps, 'dungeonComplexity', { rename:'Complexity', type:'slide', min:1, max:60, precision:0 })
        gr.add( backroom.config.maps, 'dimentionMultiplier', { rename:'dimention_M', type:'slide', min:1, max:60, precision:0 })
        gr.add( backroom.config.maps, 'roomMultiplier', { rename:'Room_M', type:'slide', min:1, max:60, precision:0 })
        gr.add( backroom.config.maps, 'dungeonConnections', { rename:'Connections', type:'slide', min:1, max:60, precision:0 })
        gr.add( backroom.config.maps, 'dungeonMaps', { rename:'Maps', type:'slide', min:1, max:60, precision:0 })
        gr.add( backroom.config.maps, 'dungeonTraps', { rename:'Traps', type:'slide', min:1, max:60, precision:0 })
        

    }


}