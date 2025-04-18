import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

class PhysicsWorld {
  constructor(config) {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });

    this.debugging = config.debugging || false;
    this.debugger = (this.debugging) ? new CannonDebugger(config.scene, this.world, { color: 0xff0000 }) : null;

    // defines material properties 
    // for physics bodies
    this.materials = {};

    // for classifying physics bodies
    this.groups = {};

    // used to register different types of bodies in our physics world
    this.body_types = {};
  }

  setup_debugger(scene) {
    this.debugging = true;
    this.debugger = new CannonDebugger(scene, this.world, { color: 0xff0000 });
  }

  // name = key in this.body_types
  // create_body = method stored
  register_body(name, create_body) {
    this.body_types[name] = create_body;
  }

  // 
  add_body(type, config) {
    const new_body = this.body_types[type](config);
    this.world.addBody(new_body);
    return new_body;
  }

  // add material
  // default friction: 0.1
  // default restitution : 0
  add_material(name, properties) {
    this.materials[name] = new CANNON.Material();
    this.materials[name].friction = properties.friction || 0.1;
    this.materials[name].restitution = properties.restitution || 0;
  }

  // @add_contact_material 
  // specifies how two properties should interact with each other
  // if not specified here, defaults to material properties
  // default friction: 0.1
  // default restitution : 0
  add_contact_material(material1, material2, contact_properties) {
    this.world.addContactMaterial(new CANNON.ContactMaterial(material1, material2, {
      friction: contact_properties.friction || 0.1,
      restitution: contact_properties.restitution || 0,
    }));
  }

  create_group(name) {
    this.groups[name] = Object.keys(this.groups).length + 1;
  }

  // Update
  // Can be called in any loop to update physics world iteratively
  update() {
    this.world.fixedStep();
    // same as world.step?
  }

  clone() {
    let newWorld = new PhysicsWorld({ debugging: this.debugging });

    // Copy groups
    Object.keys(this.groups).forEach(group => {
      newWorld.create_group(group);
    });

    // Copy materials
    Object.keys(this.materials).forEach(material => {
      newWorld.add_material(material, {
        friction: this.materials[material].friction,
        restitution: this.materials[material].restitution
      });
    });

    // Copy contact materials
    this.world.contactmaterials.forEach(contactMaterial => {
      newWorld.add_contact_material(
        contactMaterial.materials[0],
        contactMaterial.materials[1],
        { friction: contactMaterial.friction, restitution: contactMaterial.restitution }
      );
    });

    // Copy registered bodies
    Object.entries(this.body_types).forEach(([name, factory]) => {
      newWorld.register_body(name, factory);
    });

    return newWorld;
  }
}

export default PhysicsWorld;