import HitscanGun from "./HitscanGun";

export default class Pistol extends HitscanGun {
  constructor(config = {}) {
    super({
      name: 'Pistol',
      fireRate: 0.5,
      magazineSize: 5,
      damage: 10,
      range: 100
    });
  }
}