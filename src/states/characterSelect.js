import { State, Phaser } from 'phaser';
import SignalManager from '../services/signalManager';
import PlayerMapping from '../services/PlayerMapping';
import Controller from '../services/Controller';
import Config from '../config';

export default class characterSelect extends State {
  init() {
    console.log('characterSelect state is loaded.');
    // console.log(slug.gamePad);

    game.playerMap = new PlayerMapping();
    this.buttonInput = [];
    this.pads = [];
    game.controllers = [];
    this.controllersAdded = [false, false, false, false];
    this.screens = [1, 2, 3, 4];
  }

  create() {
    game.stage.backgroundColor = '#2d2d2d';

    game.input.gamepad.start();

    for (let i = 1; i < 5; i++) {
      this.pads.push(game.input.gamepad[`pad${i}`]);
      const settings = Config.playerInput[`player${i}`];
      game.controllers.push(new Controller(game, null, game.input.gamepad[`pad${i}`], settings));
    }
  }

  update() {
    for (let i = 0; i < game.controllers.length; i++) {
      game.controllers[i].update();
      if (game.controllers[i].buttonInput.b) {
        game.state.start('Game');
      }
      if (this.controllersAdded[i]) continue;
      for (const buttonPress in game.controllers[i].buttonInput) {
        if (game.controllers[i].buttonInput[buttonPress]) {
          this.addPlayer(game.controllers[i]);
          this.controllersAdded[i] = true;
          console.log('adding controller: ', i + 1);

          switch (game.totalPlayers-1) {
            case 0:
              this.screen = game.add.sprite(300, 120, 'menuCard');
              this.screens.push(this.screen);
              game.add.text(this.screen.x, this.screen.y, `${game.totalPlayers}`);
              break;
            case 1:
              this.screen = game.add.sprite(700, 120, 'menuCard');
              this.screens.push(this.screen);
              game.add.text(this.screen.x, this.screen.y, `${game.totalPlayers}`);
              break;
            case 2:
              this.screen = game.add.sprite(300, 400, 'menuCard');
              this.screens.push(this.screen);
              game.add.text(this.screen.x, this.screen.y, `${game.totalPlayers}`);
              break;
            case 3:
              this.screen = game.add.sprite(700, 400, 'menuCard');
              this.screens.push(this.screen);
              game.add.text(this.screen.x, this.screen.y, `${game.totalPlayers}`);
              break;
          }
        }
      }
    }
  }

  addPlayer(controller) {
    game.playerMap.addPlayer(controller);
  }
}
