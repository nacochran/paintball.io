// Import Three.js
import * as THREE from 'three';
import Entity from '../GameObjects/Entity.js';

class ShapeHelper extends Entity {
    /**
     * Constructor to create a 3D shape.
     * @param {string} shapeType - The type of shape (e.g., 'box', 'sphere', 'cone', 'cylinder', etc.).
     * @param {Object} options - Options for the shape geometry.
     * @param {Object} materialOptions - Options for the material.
     * @param {Object} config - Configuration for the Entity base class.
     */
    constructor(shapeType, options = {}, materialOptions = {}, config = {}) {
        super(config);
        this.shapeType = shapeType.toLowerCase();
        this.options = options;
        this.materialOptions = materialOptions;
        this.mesh = this.createShape();
        this.setPosition(this.x || 0, this.y || 0, this.z || 0);
    }

    /**
     * Creates a shape based on the type and options provided.
     * @returns {THREE.Mesh} - The created 3D shape mesh.
     */
    createShape() {
        let geometry;

        // Create geometry based on the shape type
        switch (this.shapeType) {
            case 'box':
                geometry = new THREE.BoxGeometry(
                    this.options.width || 1,
                    this.options.height || 1,
                    this.options.depth || 1
                );
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(
                    this.options.radius || 1,
                    this.options.widthSegments || 32,
                    this.options.heightSegments || 16
                );
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(
                    this.options.radius || 1,
                    this.options.height || 2,
                    this.options.radialSegments || 32
                );
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(
                    this.options.radiusTop || 1,
                    this.options.radiusBottom || 1,
                    this.options.height || 2,
                    this.options.radialSegments || 32
                );
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(
                    this.options.radius || 1,
                    this.options.tube || 0.4,
                    this.options.radialSegments || 16,
                    this.options.tubularSegments || 100
                );
                break;
            case 'plane':
                geometry = new THREE.PlaneGeometry(
                    this.options.width || 1,
                    this.options.height || 1
                );
                break;
            default:
                throw new Error(`Shape type "${this.shapeType}" is not supported.`);
        }

        // Create a material
        const material = new THREE.MeshStandardMaterial({
            color: this.materialOptions.color || 0xffffff,
            wireframe: this.materialOptions.wireframe || false,
            ...this.materialOptions
        });

        // Return the mesh
        return new THREE.Mesh(geometry, material);
    }

    /**
     * Adds the created mesh to a scene.
     */
    addToScene(scene) {
        if (!(scene instanceof THREE.Scene)) {
            throw new Error('Invalid scene provided.');
        }
        scene.add(this.mesh);
    }

    /**
     * Updates the position of the shape.
     * @param {number} x - The X-coordinate.
     * @param {number} y - The Y-coordinate.
     * @param {number} z - The Z-coordinate.
     */
    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    /**
     * Updates the rotation of the shape.
     * @param {number} x - The X rotation (in radians).
     * @param {number} y - The Y rotation (in radians).
     * @param {number} z - The Z rotation (in radians).
     */
    setRotation(x, y, z) {
        this.mesh.rotation.set(x, y, z);
    }

    /**
     * Updates the scale of the shape.
     * @param {number} x - The scale factor along the X-axis.
     * @param {number} y - The scale factor along the Y-axis.
     * @param {number} z - The scale factor along the Z-axis.
     */
    setScale(x, y, z) {
        this.mesh.scale.set(x, y, z);
    }

    /**
     * Updates the entity (placeholder for custom update logic).
     */
    update() {
        // Custom update logic can be added here
    }
}

// Example Usage
/*
// import { Scene } from 'three';
const scene = new THREE.Scene();

// Create a box and add it to the scene
const box = new ShapeHelper('box', { width: 2, height: 2, depth: 2 }, { color: 0x00ff00 }, { x: 0, y: 1, z: 0 });
box.addToScene(scene);

// Create a sphere and add it to the scene
const sphere = new ShapeHelper('sphere', { radius: 1 }, { color: 0xff0000 }, { x: 3, y: 1, z: 0 });
sphere.addToScene(scene);
*/
export default ShapeHelper;