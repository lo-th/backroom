import * as THREE from 'three/webgpu';
import { 
    densityFogFactor, mix, reference, uniform, vec2, vec3, vec4, pass, mrt, output, normalView, emissive, materialEmissive,
    diffuseColor, velocity, add, packNormalToRGB, unpackRGBToNormal, sample, replaceDefaultUV,
    materialMetalness, materialRoughness, screenUV,  step, abs, float, renderOutput, saturation 
} from 'three/tsl';
import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { boxBlur } from 'three/addons/tsl/display/boxBlur.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { ssgi } from 'three/addons/tsl/display/SSGINode.js';
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { ssr } from 'three/addons/tsl/display/SSRNode.js';
import { temporalReproject } from 'three/addons/tsl/display/TemporalReprojectNode.js';
import { recurrentDenoise } from 'three/addons/tsl/display/RecurrentDenoiseNode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { sharpen } from 'three/addons/tsl/display/SharpenNode.js';
import { circle } from 'three/addons/tsl/display/Shape.js';
import { chromaticAberration } from './ChromaticAberrationNode.js';
//import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { dualKawaseBloom } from './DualKawaseBloomNode.js';

import { barrelUV, barrelMask, colorBleeding, scanlines, vignette } from 'three/addons/tsl/display/CRT.js';

let scenePass, scenePassColor, scenePassDiffuse, scenePassDepth, scenePassNormal, scenePassVelocity, emissivePass
let diffuseTexture, normalTexture, sceneNormal, scenePassMetalRough, emissiveTexture 
let renderer, scene, camera, ui, env

let gammaUniform, contrastUniform, saturationUniform

export class PostProd extends THREE.RenderPipeline {

    constructor( Renderer, Scene, Camera, Ui, Env ){

        super(Renderer)

        ui = Ui
        renderer = Renderer
        scene = Scene
        camera = Camera
        env = Env

        const affineDistortion = uniform( 0 );

        

        // scene pass
        scenePass = pass( scene, camera );//, { affineDistortion }

        const mrtNode = mrt( {
            output: output,
            diffuseColor: diffuseColor.rgb,//diffuseColor,
            diffuseColor: vec4( diffuseColor.rgb, emissive.r ),//diffuseColor,
            //diffuseColor: vec4( diffuseColor.rgb, materialMetalness ),//diffuseColor,
            //emissive: emissive.rgb,//vec4( emissive, output.a ),
            normal: packNormalToRGB( normalView ),
            //normal: vec4( packNormalToRGB( normalView ).rgb, materialRoughness ),
            velocity: velocity
        });
        mrtNode.setBlendMode( 'emissive', new THREE.BlendMode( THREE.NormalBlending ) );
        scenePass.setMRT( mrtNode )

        // pass

        scenePassColor = scenePass.getTextureNode( 'output' )//.toInspector( 'Color' );;
            
        //emissivePass = scenePass.getTextureNode( 'emissive' )//.toInspector( 'Emissive' );
        scenePassDiffuse = scenePass.getTextureNode( 'diffuseColor' )//.toInspector( 'Diffuse Color' );
        scenePassDepth = scenePass.getTextureNode( 'depth' )//.toInspector( 'Depth', () => { return scenePass.getLinearDepthNode(); });
        scenePassNormal = scenePass.getTextureNode( 'normal' )//.toInspector( 'Normal' );
        scenePassVelocity = scenePass.getTextureNode( 'velocity' )//.toInspector( 'Velocity' );

        // bandwidth optimization

        diffuseTexture = scenePass.getTexture( 'diffuseColor' );
        diffuseTexture.type = THREE.UnsignedByteType;

        normalTexture = scenePass.getTexture( 'normal' );
        normalTexture.type = THREE.UnsignedByteType;

        //emissiveTexture = scenePass.getTexture( 'emissive' );
        //emissiveTexture.type = THREE.UnsignedByteType;

        //const emissiveTexture = scenePass.getTexture( 'emissive' );
        //emissiveTexture.type = THREE.UnsignedByteType;

        sceneNormal = sample( ( uv ) => { return unpackRGBToNormal( scenePassNormal.sample( uv ) ); } );

        // metalness in diffuseColor.a, roughness in normal.a (no separate metalrough MRT)
        /*scenePassMetalRough = sample( ( uv ) => vec2(
            scenePassDiffuse.sample( uv ).a,
            scenePassNormal.sample( uv ).a
        ) )//.toInspector( 'Metalness/Roughness' );*/

        this.initGi()
        //this.initSSR()

    }

    initSSR(){

        const params = {
            output: 0,
            roughness: 0.3,

            ssr: {
                resolutionScale: 1,
                quality: 0.25,
                mirrorBias: 0.5,
                maxDistance: 0.4,
                intensity: 1,
                thickness: 0.1,
                maxLuminance: 35,
                binaryRefine: false,
                stepExponent: 3,
                envImportanceSampling: false,
                screenEdgeFade: 0.2,
                screenEdgeFadeBlack: false, // for indoor scenes, set to true
                environmentIntensity: 3.14, // not too sure why exactly, but multiplying by ~PI makes the env map reflections match Blender more
            },

            temporalReproject: {
                maxFrames: 16,
                clampIntensity: 0.25,
                flickerSuppression: 1,
                hitPointReprojection: true,
            },

            denoise: {
                enabled: true,
                lumaPhi: 0.75,
                depthPhi: 20,
                normalPhi: 0.3,
                roughnessPhi: 100,
                radius: 1.5,
                alphaPhi: 5,
                strength: 0.725,
                adapt: 0.5,
                smoothDisocclusions: true,
                flickerSuppression: 1,
                adaptiveTrust: 1
            },

            post: {
                grading: { toneMapping: 'AgX', exposure: 1.57, gamma: 0.89, contrast: 1.31, saturation: 1 },
            },
        };

        const hdrTexture = env

        const ssrNode = ssr( scenePassColor, scenePassDepth, sceneNormal, {
            stochastic: true,
            diffuseNode: scenePassDiffuse,
            metalnessNode: scenePassDiffuse.a,
            roughnessNode: scenePassNormal.a,
            environmentNode: hdrTexture,
            envImportanceSampling: params.ssr.envImportanceSampling,
            binaryRefine: params.ssr.binaryRefine
        } );
        ssrNode.setEnvMap( hdrTexture );
        ssrNode.toInspector( 'SSR' );

        const temporalReprojectNode = temporalReproject( ssrNode, scenePassDepth, scenePassNormal, scenePassVelocity, camera, {
            mode: 'specular',
            accumulate: false
        });
        temporalReprojectNode.toInspector( 'Temporal Reproject' );

        const denoiseNode = recurrentDenoise( temporalReprojectNode, camera, {
            depth: scenePassDepth,
            normal: scenePassNormal,
            raw: ssrNode,
            metalRoughness: scenePassMetalRough,
            mode: 'specular',
            accumulate: true,
        });
        denoiseNode.alphaSource = 'raylength'; // SSR alpha channel contains ray length
        denoiseNode.toInspector( 'Denoise' );
        // feed the denoised result + velocity back into SSR for multi-bounce reflections
        ssrNode.setHistory( denoiseNode, scenePassVelocity );
        temporalReprojectNode.setHistoryTexture( denoiseNode );

        const denoisePassBlend = vec4( denoiseNode.rgb, ssrNode.a.greaterThan( 0 ).toVar() );

        gammaUniform = uniform( params.post.grading.gamma );
        contrastUniform = uniform( params.post.grading.contrast );
        saturationUniform = uniform( params.post.grading.saturation );

        const litColor = scenePassColor.rgb.add( denoisePassBlend.rgb );

        const outputNode = vec4( litColor, 1 );
        outputNode.toInspector( 'Combined SSR' );
        const combinedOutputNode = outputNode;

        this.outputNode = this.applyPostProcessing( combinedOutputNode );
        this.outputColorTransform = false;

        this.applyParams(ssrNode, temporalReprojectNode, denoiseNode, params )

    }



    applyPostProcessing( source ) {

        return sharpen( traa( this.applyGrading( source ), scenePassDepth, scenePassVelocity, camera ), 0 );

    }

    applyGrading( source ) {

        gammaUniform = uniform( 0.89 );
        contrastUniform = uniform(1.31 );
        saturationUniform = uniform( 1 );

        let rgb = source.rgb;

        rgb = renderOutput( vec4( rgb, 1 ), THREE.AgXToneMapping, THREE.SRGBColorSpace ).rgb;
        rgb = rgb.sub( 0.5 ).mul( contrastUniform ).add( 0.5 );
        rgb = saturation( rgb, saturationUniform );
        rgb = rgb.max( 0.0 ).pow( float( 1 ).div( gammaUniform ) );

        return vec4( rgb, 1 );

    }

    applyParams(ssrNode, temporalReprojectNode, denoiseNode, params ) {

        if ( ! ssrNode ) return;

            ssrNode.resolutionScale = params.ssr.resolutionScale;
            ssrNode.quality.value = params.ssr.quality;
            ssrNode.mirrorBias.value = params.ssr.mirrorBias;
            // stepExponent / screenEdgeFadeBlack / binaryRefine are build-time constants: assigning
            // them recompiles the SSR material (the setters no-op when the value is unchanged).
            ssrNode.stepExponent = params.ssr.stepExponent;
            ssrNode.binaryRefine = params.ssr.binaryRefine;
            ssrNode.maxDistance.value = params.ssr.maxDistance;
            ssrNode.intensity.value = params.ssr.intensity;
            ssrNode.thickness.value = params.ssr.thickness;
            ssrNode.maxLuminance.value = params.ssr.maxLuminance;
            ssrNode.screenEdgeFade.value = params.ssr.screenEdgeFade;
            ssrNode.screenEdgeFadeBlack = params.ssr.screenEdgeFadeBlack;
            ssrNode.environmentIntensity.value = params.ssr.environmentIntensity;

        if ( temporalReprojectNode ) {

            temporalReprojectNode.maxFrames.value = params.temporalReproject.maxFrames;
            temporalReprojectNode.clampIntensity.value = params.temporalReproject.clampIntensity;
            temporalReprojectNode.flickerSuppression.value = params.temporalReproject.flickerSuppression;
            temporalReprojectNode.hitPointReprojection.value = params.temporalReproject.hitPointReprojection;

        }

        if ( denoiseNode ) {

            denoiseNode.lumaPhi.value = params.denoise.lumaPhi;
            denoiseNode.depthPhi.value = params.denoise.depthPhi;
            denoiseNode.normalPhi.value = params.denoise.normalPhi;
            denoiseNode.roughnessPhi.value = params.denoise.roughnessPhi;
            denoiseNode.radius.value = params.denoise.enabled ? params.denoise.radius : 0;
            denoiseNode.alphaPhi.value = params.denoise.alphaPhi;
            denoiseNode.strength.value = params.denoise.strength;
            denoiseNode.adapt.value = params.denoise.adapt;
            denoiseNode.smoothDisocclusions.value = params.denoise.smoothDisocclusions;
            denoiseNode.flickerSuppression.value = params.denoise.flickerSuppression;
            denoiseNode.adaptiveTrust.value = params.denoise.adaptiveTrust;

        }
    }

    initGi(){

        /*const curvature = uniform( 0.03 );
        const distortedUV = barrelUV( curvature );
        const distortedDelta = circle( curvature.add( .1 ).mul( 10 ), 1 ).mul( curvature ).mul( .05 );


        scenePassColor = replaceDefaultUV( distortedUV, scenePassColor );
        scenePassDiffuse = replaceDefaultUV( distortedUV, scenePassDiffuse );
        //scenePassDepth = replaceDefaultUV( distortedUV, scenePassDepth );*/
        //sceneNormal = replaceDefaultUV( distortedUV, sceneNormal );



        //this.outputNode = compositeNode;

        // gi

        let giPass = ssgi( scenePassColor, scenePassDepth, sceneNormal, camera );
       // giPass.sliceCount.value = 3
        //giPass.sliceCount.value = 2;
        giPass.stepCount.value = 8;
        giPass.aoIntensity.value = 1
        //giPass.thickness.value = 5;
        /*giPass.giIntensity.value = 80; 
        giPass.radius.value = 20
        
        giPass.stepCount.value = 16*/

       

        // composite

        const ao = giPass.getAONode()//.toInspector( 'SSGI.AO' );
        let gi = giPass.getGINode()//.toInspector( 'SSGI.GI' );

        //gi = denoise( gi.rgb, scenePassDepth, sceneNormal, camera )
        //const density = reference( 'density', 'float', scene.fog );
        const scenePassViewZ = scenePass.getViewZNode();
        const density = uniform( 0.2 )//reference( 'density', 'float', scene.fog );
        const scattering = uniform( 1 );
        
        //const giScattering = uniform( 1.5 );
        //gi = gaussianBlur( gi.rgb, vec2( giScattering ), 8, { resolutionScale: 1.0, premultipliedAlpha:false } );

        const sceneColorBlurred = gaussianBlur( gi.rgb, vec2( scattering ), 8, { resolutionScale: 1.0, premultipliedAlpha:false } );
        const fogFactor = densityFogFactor( density ).context( { getViewZ: () => scenePassViewZ } );
        //gi = mix( gi.rgb, sceneColorBlurred.rgb, fogFactor );
        


        /*const strength = uniform( 1 );
        const radius = uniform( 0 );
        const threshold = uniform( 0 );

        gi = dualKawaseBloom( gi.rgb, strength, radius, threshold )*/


        //gi = boxBlur( gi, { separation: 1.5, size:1.0 } );

        const compositePass = vec4( add( scenePassColor.rgb.mul( ao.r ), ( scenePassDiffuse.rgb.mul( gi.rgb ) ) ), scenePassColor.a );
        compositePass.name = 'Composite';

        //const denoiseNode


        


        

        // traa

        const traaPass = traa( compositePass, scenePassDepth, scenePassVelocity, camera );
        //this.outputNode = traaPass;


        // blur pass (always downsampled to improve performance)

        /*const scenePassViewZ = scenePass.getViewZNode();
        const density = reference( 'density', 'float', scene.fog );
        const scattering = uniform( 0.5 );

        const sceneColorBlurred = gaussianBlur( compositePass, vec2( scattering ), 4, { resolutionScale: 0.5 } );
        const fogFactor = densityFogFactor( density ).context( { getViewZ: () => scenePassViewZ } );
        let compositeNode = mix( traaPass, sceneColorBlurred, fogFactor );*/
        const BloomStrength = uniform( 6 );
        const BloomRadius = uniform( 0. );
        const BloomThreshold = uniform( 0 );




        let compositeNode = traaPass.add( dualKawaseBloom( vec3(scenePassDiffuse.a), BloomStrength, BloomRadius, BloomThreshold ))
        //let compositeNode = traaPass.add( bloom( compositePass, BloomStrength, BloomRadius, BloomThreshold ))


       // let compositeNode = traaPass

        // barrel sistortion

        const curvature = uniform( 0.03 );
        const distortedUV = barrelUV( curvature );
        const distortedDelta = circle( curvature.add( .1 ).mul( 10 ), 1 ).mul( curvature ).mul( .05 );
        const vignetteIntensity = uniform( 0.3 );


        compositeNode = replaceDefaultUV( distortedUV, compositeNode );
        compositeNode = vignette( compositeNode, vignetteIntensity, 0.6 );

        //this.outputNode = compositeNode;



        // chromaticAberration

        // Create uniform nodes for the static version that can be updated
        const staticStrength = uniform( 0.4 );//1.5
        const staticCenter = uniform( new THREE.Vector2( 0.5, 0.5 ) );
        const staticScale = uniform( 0.3 );//1.2

        // With static values (using uniform nodes)
        let chroma = chromaticAberration( compositeNode, staticStrength, staticCenter, staticScale );





        this.outputNode = chroma;

        this.outputNode = this.applyPostProcessing( chroma );
        this.outputColorTransform = false;


        //const fxaaPass = fxaa( retro );
        //this.outputNode = fxaaPass;



        













        //this.outputNode = retro;

        //const caPass = barrelUV( compositeNode, staticStrength, staticCenter, staticScale );
        //this.outputNode = caPass;




        this.compositePass = compositePass
        this.traaPass = traaPass
        this.giPass = giPass
        this.ao = ao
        this.gi = gi





        // UI

        const params = {
            output: 0
        };

        const types = { Combined: 0, Direct: 3, AO: 1, GI: 2 };

        let gr = ui.add('group', { name:'POST EFFECT', open:false, h:30 })
        gr.add( renderer, 'toneMappingExposure', { rename:'exposure', type:'slide', min:0.01, max:3, precision:2 })
        gr.add( scene, 'environmentIntensity', { rename:'environment', type:'slide', min:0, max:100, precision:2 })
        gr.add( scene.fog, 'density', { rename:'fog density', type:'slide', min:0.001, max:0.16, precision:3 })

        gr.add('empty', {h:10})

        //gr.add( 'list', { name:'mode', list:types }).onChange( (v)=> {this.updatePostprocessing(v)} );

        gr.add( giPass.sliceCount, 'value', { rename:'sliceCount', type:'slide', min:1, max:4, precision:0 })
        gr.add( giPass.stepCount, 'value', { rename:'stepCount', type:'slide', min:1, max:32, precision:0 })
        gr.add( giPass.radius, 'value', { rename:'radius', type:'slide', min:1, max:50, precision:0 })
        gr.add( giPass.expFactor, 'value', { rename:'expFactor', type:'slide', min:1, max:3, precision:2 })
        gr.add( giPass.thickness, 'value', { rename:'thickness', type:'slide', min:0.01, max:10, precision:2 })
        gr.add( giPass.backfaceLighting, 'value', { rename:'backLight', type:'slide', min:0, max:1, precision:2 })
        gr.add( giPass.aoIntensity, 'value', { rename:'aoIntensity', type:'slide', min:0, max:4, precision:2 })
        gr.add( giPass.giIntensity, 'value', { rename:'giIntensity', type:'slide', min:0, max:200, precision:2 })

        /*gr.add( gi.radius, 'value', { rename:'giradius', type:'slide', min:0, max:30, precision:2 })
        gr.add( gi.depthPhi, 'value', { rename:'gidepthPhi', type:'slide', min:0, max:10, precision:2 })
        gr.add( gi.normalPhi, 'value', { rename:'ginormalPhi', type:'slide', min:0, max:10, precision:2 })
        gr.add( gi.index, 'value', { rename:'giindex', type:'slide', min:0, max:10, precision:2 })*/

        //gr.add( giScattering, 'value', { rename:'giScattering', type:'slide', min:0, max:10, precision:2 })
       // gr.add( giSigma, 'value', { rename:'giScattering', type:'slide', min:0, max:10, precision:2 })

        gr.add( giPass.useLinearThickness, 'value', { rename:'use Linear thickness', type:'bool', p:80 })
        gr.add( giPass.useScreenSpaceSampling, 'value', { rename:'screen space sampling', type:'bool', p:80 })
        gr.add( giPass, 'useTemporalFiltering', { rename:'temporal filtering', type:'bool', p:80 }).onChange( ()=> {this.updatePostprocessing()} );

        gr.add('empty', {h:10})

        gr.add( BloomStrength, 'value', { rename:'b strength', type:'slide', min:0, max:100, precision:2 })
        gr.add( BloomRadius, 'value', { rename:'b radius', type:'slide', min:0, max:3, precision:2 })
        gr.add( BloomThreshold, 'value', { rename:'b threshold', type:'slide', min:0, max:3, precision:2 })

        gr.add('empty', {h:10})

        gr.add( curvature, 'value', { rename:'curvature', type:'slide', min:0, max:0.2, precision:2 })
        gr.add( vignetteIntensity, 'value', { rename:'vignette', type:'slide', min:0, max:2, precision:2 })
        gr.add( staticStrength, 'value', { rename:'chroma1', type:'slide', min:0, max:3, precision:2 })
        gr.add( staticScale, 'value', { rename:'chroma2', type:'slide', min:0, max:3, precision:2 })

        


        

    }

    updatePostprocessing( value ) {

        if ( value === 1 ) {

            this.outputNode = vec4( vec3( this.ao.r ), 1 );

        } else if ( value === 2 ) {

            this.outputNode = vec4( this.gi.rgb, 1 );

        } else if ( value === 3 ) {

            this.outputNode = scenePassColor;

        } else {

            this.outputNode = this.giPass.useTemporalFiltering ? this.traaPass : this.compositePass;

        }

        this.needsUpdate = true;

    }



}