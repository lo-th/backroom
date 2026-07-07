import * as THREE from 'three/webgpu';
import { LightProbeGrid } from 'three/addons/lighting/LightProbeGrid.js';
import { LightProbeGridHelper } from 'three/addons/helpers/LightProbeGridHelper.js';
//import { ClusteredLighting } from 'three/addons/lighting/ClusteredLighting.js';
const probeParams = {
    enabled: true,
    showProbes: false,
    resolution: 4
};
        
export class Probe {

	constructor( renderer ){

		

	}
}

/*

async function lightProbe(){
            // Bake light probe volume

            async function bake( resolution ) {

                if ( probes ) {

                    scene.remove( probes );
                    probes.dispose();

                }

                probes = new LightProbeGrid( 64, 2.8, 64, resolution, resolution, resolution );
                probes.position.set( 0, 1.5, 0 );
                await probes.bake( renderer, scene, { cubemapSize: 32, near: 0.05, far: 10 } );
                probes.visible = probeParams.enabled;
                scene.add( probes );

                // Update debug visualization

                if ( ! probesHelper ) {

                    probesHelper = new LightProbeGridHelper( probes );
                    probesHelper.visible = probeParams.showProbes;
                    scene.add( probesHelper );

                } else {

                    probesHelper.probes = probes;
                    probesHelper.update();

                }

            }

            await bake( probeParams.resolution );

            // GUI

            const gui = renderer.inspector.createParameters( 'Light Probes' );
            gui.add( probeParams, 'enabled' ).name( 'GI' ).onChange( ( value ) => {

                probes.visible = value;

            } );

            let rebakeTimer = null;
            gui.add( probeParams, 'resolution', 2, 12, 1 ).name( 'Resolution' ).onChange( ( value ) => {

                // Debounce so a slider drag rebakes once it settles, not every step.
                if ( rebakeTimer !== null ) clearTimeout( rebakeTimer );
                rebakeTimer = setTimeout( () => bake( value ), 250 );

            } );
            gui.add( probeParams, 'showProbes' ).name( 'Show Probes' ).onChange( ( value ) => {

                probesHelper.visible = value;

            });
        }
        */