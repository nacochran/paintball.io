import ProjectileGun from "./ProjectileGun";

export default class RPG extends ProjectileGun {
  constructor(config = {}) {
    super({
      name: 'RPG',
      fireRate: 2,
      magazineSize: 1,
      damage: 75,
      range: 200,
    });
  }
}