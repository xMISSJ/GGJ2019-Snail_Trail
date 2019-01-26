import { Phaser, Point } from 'phaser';
import Sprite from '../services/sprite';
import Controller from '../services/Controller';
import Config from '../config';
import SignalManager from '../services/signalManager';
import GameManager from '../services/gameManager';

export default class Slug extends Sprite {
  constructor(playerNumber, position) {
    super({ asset: 'slug', x: position[0], y: position[1] });

    this.states = { SLUG: 0, SNAIL: 1 };
    Object.freeze(this.state);

    this.maxHP = 3;

    this.switchState(this.states.SLUG);
    this.currentHP = this.maxHP;

    this.shell = null;

    this.collidingWith = [];

    this.playerNumber = playerNumber;

    game.physics.arcade.enable(this);
    this.body.enable = true;
    this.body.setCircle(26, -8, 15);
    this.body.bounce.set(1);
    this.body.collideWorldBounds = true;
    this.body.drag.setTo(500, 500);

    this.scale.set(1.5, 1.5);
    this.settings = Config.playerInput[`player${playerNumber}`];
    this.gamePad = this.game.input.gamepad[`pad${playerNumber}`];
    this.controller = new Controller(game, this, this.gamePad, this.settings);

    this.currentDirection = new Point(1, 0);
    this.targetDirection = new Point(0, 0);
    this.lastDirection = new Point(1, 0);

    this.rotationSpeed = 1.5;
    this.currentMovementSpeed = 0;
    this.movementSpeedStep = 0.05;
    this.maxMovementSpeed = 2;
    this.boostSpeed = 5;
    this.speedDecrease = 0.12;

    this.isMoving = false;

    this.canBoost = true;
    this.isBoosting = false;
    this.createSlug();
  }

  createSlug() {
    this.smoothed = false;
    SignalManager.instance.dispatch('addSlug', this);
    this.moving = this.animations.add('moving', [0, 1, 2, 3], 10, true);
    // this.idle = this.player.animations.add('idle', [0,3], 10, true);
  }

  onCollideSlug(entity1, entity2) {
    const index = this.collidingWith.indexOf(entity2);

    if (index === -1) {
      this.collidingWith.push(entity2);
    } else {
      console.log('already collided');
      return;
    }
    this.setVelocity(entity1, entity2, 200);

    this.removeHealth(entity1, entity2, 1);
  }

  checkIfNotColliding(entity) {
    const index = this.collidingWith.indexOf(entity);

    if (index >= 0) {
      this.collidingWith.splice(index, 1);
    }
  }

  setVelocity(entity1, entity2, magnitude) {
    console.log('set velocity');
    const point = new Point();
    const difference = Point.subtract(entity1.position, entity2.position, point).normalize();
    this.body.velocity.setTo(this.body.velocity.x + difference.x * magnitude, this.body.velocity.y + difference.y * magnitude);
  }

  onCollideShell(entity1, entity2) {
    entity2.onCollide();
    this.switchState(this.states.SNAIL);
    GameManager.instance.pickUpShell(this.playerNumber);

    this.shell = entity2;
  }

  removeHealth(entity1, entity2, value) {
    if (!this.isSnail) return;

    this.currentHP -= value;

    if (this.currentHP <= 0) {
      this.switchState(this.states.SLUG);
      GameManager.instance.dropShell();

      this.setVelocity(entity1, entity2, 1000);
      if (this.shell) {
        this.shell.onSpawn(this.position);
        this.shell = null;
      }
    }
  }

  update() {
    this.controller.update();
    this.currentDirection.normalize();

    if (this.targetDirection.getMagnitude() > 0.2) {
      if (this.currentDirection.getMagnitude() < 0.2) {
        console.log('lastDirection', this.lastDirection);
        this.isMoving = true;
        this.currentDirection.x = this.lastDirection.x;
        this.currentDirection.y = this.lastDirection.y;
        this.currentDirection.normalize();
      }

      this.rotate();
      this.currentMovementSpeed += this.movementSpeedStep;
    } else if (this.currentDirection.getMagnitude() > 0.2) {
      this.currentMovementSpeed -= this.movementSpeedStep * 3;
      this.lastDirection.x = this.currentDirection.x;
      this.lastDirection.y = this.currentDirection.y;
    } else if (this.isMoving) {
      this.isMoving = false;
      this.currentMovementSpeed = 0;
    }

    if (this.isBoosting) {
      this.currentMovementSpeed -= this.speedDecrease;
      if (this.currentMovementSpeed < this.maxMovementSpeed) {
        this.currentMovementSpeed = this.maxMovementSpeed;
        this.isBoosting = false;
        this.canBoost = true;
        // TODO Start cooldown
      }
    } else {
      this.currentMovementSpeed = Phaser.Math.clamp(this.currentMovementSpeed, 0, this.maxMovementSpeed);
    }
    this.currentDirection.multiply(this.currentMovementSpeed, this.currentMovementSpeed);

    this.x += this.currentDirection.x;
    this.y += this.currentDirection.y;
    this.doAnimation();
  }

  rotate() {
    if (this.targetDirection.x * this.currentDirection.y > this.targetDirection.y * this.currentDirection.x) {
      this.currentDirection.rotate(0, 0, -this.rotationSpeed, true);
    } else {
      this.currentDirection.rotate(0, 0, this.rotationSpeed, true);
    }

    const newAngle = this.currentDirection.angle(new Point(0, 0), true) + 180;
    this.angle = newAngle + 90;
  }

  doAnimation() {
    if (this.isMoving) {
      this.play('moving');
    } else {
      // TODO Play idle
    }
  }

  moveUp() {

  }

  moveDown() {

  }

  moveLeft() {

  }

  moveRight() {

  }

  /* -----------------------------
   * States management
   ----------------------------- */

  switchState(state) {
    this.currentState = state;

    switch (this.currentState) {
      case this.states.SLUG:
        this.switchToSlug();
        break;
      case this.states.SNAIL:
        this.switchToSnail();
        break;
      default: console.warn('Something is wrong with ', this.currentState);
    }
  }

  get isSlug() {
    return this.currentState === this.states.SLUG;
  }

  get isSnail() {
    return this.currentState === this.states.SNAIL;
  }

  switchToSlug() {
    // TODO for testing purposes
    this.tint = 0xffffff;
    this.currentHP = 3;
    this.maxMovementSpeed -= 1;
  }

  switchToSnail() {
    // TODO for testing purposes
    this.tint = Math.random() * 0xffffff;
    this.maxMovementSpeed += 1;
  }

  shoot() {
    if (this.canBoost) {
      this.canBoost = false;
      this.isBoosting = true;
      this.currentMovementSpeed += this.boostSpeed;
    }
  }
}
