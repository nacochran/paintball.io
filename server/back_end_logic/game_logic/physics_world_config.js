import * as CANNON from 'cannon-es';
import PhysicsWorld from './PhysicsWorld.js';


// initalize physics world
const physics_world = new PhysicsWorld({});

// players will not collide with other players
physics_world.create_group("players");
// anything that collides with player should go here
physics_world.create_group("blocks");

// create materials
physics_world.add_material("player", { friction: 0.1, restitution: 0.0 });
physics_world.add_material("platform", { friction: 0.1, restitution: 0.0 });
physics_world.add_material("box", { friction: 0.1, restitution: 0.0 });

// specify contact properties between materials
physics_world.add_contact_material('player', 'platform', { friction: 0.1, restitution: 0.0 });

// register body types
physics_world.register_body('player', (config) => {
  const body = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Box(config.size || new CANNON.Vec3(1, 1, 1)),
    position: config.position || new CANNON.Vec3(0, 0, 0)
  });
  body.angularDamping = 1;
  body.material = physics_world.materials['player'];
  body.collisionFilterGroup = physics_world.groups['players'];
  body.collisionFilterMask = physics_world.groups['blocks'];
  body.linearDamping = 0.1;
  return body;
});
physics_world.register_body('dynamic-box-1', (config) => {
  const body = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Box(config.size || new CANNON.Vec3(1, 1, 1)),
    position: config.position || new CANNON.Vec3(0, 0, 0)
  });
  body.material = physics_world.materials['box'];
  body.collisionFilterGroup = physics_world.groups['blocks'];
  body.angularDamping = 1;
  return body;
});
physics_world.register_body('static-box-1', (config) => {
  const body = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(config.size || new CANNON.Vec3(1, 1, 1)),
    position: config.position || new CANNON.Vec3(0, 0, 0)
  });
  body.material = physics_world.materials['platform'];
  body.collisionFilterGroup = physics_world.groups['blocks'];
  body.angularDamping = 1;
  return body;
});
physics_world.register_body('platform-1', (config) => {
  const body = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
    position: new CANNON.Vec3(0, 0, 0)
  });
  body.material = physics_world.materials['platform'];
  body.collisionFilterGroup = physics_world.groups['blocks'];
  // body.collisionFilterMask = physics_world.groups['players'];
  body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  return body;
});
physics_world.register_body('sphere-1', (config) => {
  const body = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Sphere(config.radius || 1),
    position: config.position || new CANNON.Vec3(0, 0, 0)
  });
  body.material = physics_world.materials['box'];
  body.collisionFilterGroup = physics_world.groups['blocks'];
  return body;
});

export default physics_world;