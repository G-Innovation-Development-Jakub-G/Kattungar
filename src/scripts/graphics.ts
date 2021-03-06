//handle all the graphics here, yo.
import { User } from './user';
import { Session } from './session';
import { Character } from './character';
import { EffectStyle} from './effectStyle';
import { SpriteContainer } from './datastore';

import * as gameLogic from './gameLogic';
import * as datastore from './datastore';
import * as PIXI from 'pixi.js';

export let renderer = new PIXI.Application(1600,900, {backgroundColor: 0x1099bb});
export let stage = new PIXI.Container();
export let spriteHolder : SpriteHolder[] = [];

export let messages : DisplayMessage[] = [];
export let effects : Effect[] = [];

export class Graphics{
}

//these message are displayed on screen for a short period of time.
class DisplayMessage {
    Message: PIXI.Text;
    Lifespan: number = 180;
    Text: string;

    constructor(message:string){
        this.Message = new PIXI.Text(message, {fill:['#FF0000']});
        this.Message.position.x = 10;
        this.Message.position.y = 10 + (32*messages.length);
        this.Text = message;
        addSprite(this.Message, 100);
    }
}

export function init(){
    renderer.renderer.autoResize = true;
    renderer.ticker.add(function(delta){
        messages.forEach((m, key) => {
            m.Lifespan -= delta;
            //set alpha to less than 1, when applicable.
            m.Message.alpha = Math.min(m.Lifespan/60, 1);
            if (m.Lifespan < 0){
                //remove it from the list.
                renderer.stage.removeChild(m.Message);
                messages.splice(key, 1);
                //shift remaining messages up.
                for (var i = key; i < messages.length; i++){
                    messages[i].Message.y -= 32;
                }
            }
        });
        effects.forEach((e, key) =>{
            e.Lifespan -= delta;
            e.Effect.alpha = Math.min(e.Lifespan/60,1); //general rule. fix later.
            if (e.Lifespan <0){
                renderer.stage.removeChild(e.Effect);
                effects.splice(key,1);
            }
            e.Styles.forEach((f, fkey) =>{
                if (f.Delay > 0){
                    f.Delay-= delta;
                }
                if (f.Delay == null || f.Delay <= 0){
                    if (f.Acceleration != null){
                        f.Velocity.x += f.Acceleration.x;
                        f.Velocity.y += f.Acceleration.y;
                    }
                    if (f.Velocity != null){
                        e.Effect.position.x += f.Velocity.x;
                        e.Effect.position.y += f.Velocity.y;
                    }
                    if (f.ColorStart != null){
                        e.Effect.tint = f.ColorStart;
                        //check if it's a text item.
                        if(e.type() == "text"){
                            let t = e as TextEffect;
                            t.Effect.style = new PIXI.TextStyle({fill: f.ColorStart});
                        }   
                    }
                    f.Lifespan-= delta;
                }
                //and kill if not needed.
                if (f.Lifespan <= 0){
                    e.Styles.splice(fkey, 1);
                }
            });
        });
        //and now sort.
        renderer.stage.children.sort(function(a : PIXI.Sprite, b : PIXI.Sprite){
            //find the holders and sort appropriately.
            let sa = spriteHolder.find(x=>a==x.Sprite);
            let sb = spriteHolder.find(x=>b==x.Sprite);
            return (sa.LayerID -sb.LayerID);
        })
    });
}

export function addMessage(message:string){
    let newMessage = new DisplayMessage(message);
    messages.push(newMessage);
}

export function drawTerrain(){
    datastore.myGame.Map.Terrain.forEach(element => {
        let item : PIXI.Sprite = new PIXI.Sprite();
        if(element.Terrain == 0){
            item = new PIXI.Sprite(datastore.sprites[0].Sprite);
        } else {
            item = new PIXI.Sprite(datastore.sprites[1].Sprite);
        }
        item.x = element.X*32;
        item.y = element.Y*32;
        addSprite(item, 0);
    });
}

//the intiial UI draw.
export function drawUI(){
    //draw some UI, too!
    addSprite(datastore.uiContainer.Name, 100);
    addSprite(datastore.uiContainer.Description, 100);
    addSprite(datastore.uiContainer.AP, 100);

    //easier to track stuff here, if we have the functions called within the main body. :)
    datastore.uiContainer.Up.on("pointerdown", gameLogic.moveButton);
    datastore.uiContainer.Left.on("pointerdown", gameLogic.moveButton);
    datastore.uiContainer.Right.on("pointerdown", gameLogic.moveButton);
    datastore.uiContainer.Down.on("pointerdown", gameLogic.moveButton);
    addSprite(datastore.uiContainer.Up, 100);
    addSprite(datastore.uiContainer.Left, 100);
    addSprite(datastore.uiContainer.Right, 100);
    addSprite(datastore.uiContainer.Down, 100);

    datastore.uiContainer.AtkUp.on("pointerdown", gameLogic.atkButton);
    datastore.uiContainer.AtkLeft.on("pointerdown", gameLogic.atkButton);
    datastore.uiContainer.AtkRight.on("pointerdown", gameLogic.atkButton);
    datastore.uiContainer.AtkDown.on("pointerdown", gameLogic.atkButton);
    addSprite(datastore.uiContainer.AtkUp, 100);
    addSprite(datastore.uiContainer.AtkLeft, 100);
    addSprite(datastore.uiContainer.AtkRight, 100);
    addSprite(datastore.uiContainer.AtkDown, 100);

    datastore.uiContainer.EndTurn.on("pointerdown", gameLogic.endTurn);
    addSprite(datastore.uiContainer.EndTurn, 100);

    //generate the Selector as well. Maybe more later.

    datastore.uiContainer.Selected = new PIXI.Sprite(datastore.sprites.find(x=>x.Name == "UI_selector").Sprite);
    datastore.uiContainer.Selected.visible = false;
    datastore.uiContainer.Selected.tint= 0x7af5f5;
    datastore.uiContainer.Selected.alpha = 0.5;
    addSprite(datastore.uiContainer.Selected, 100);

    datastore.uiContainer.Selector = new PIXI.Sprite(datastore.sprites.find(x=>x.Name == "UI_selector").Sprite);
    datastore.uiContainer.Selector.visible = false;
    datastore.uiContainer.Selector.alpha = 0.5;
    addSprite(datastore.uiContainer.Selector, 100);
}

//update the UI. Primarily called when selecting a character.
export function updateUI(char: Character = null){
    //if not selected character, hide.
    datastore.uiContainer.Name.visible = (char != null);
    datastore.uiContainer.Description.visible = (char != null);
    datastore.uiContainer.AP.visible = (char != null);

    //if it's your turn, show end turn. otherwise do not.
    if (datastore.myGame.CurrentPlayer){
        datastore.uiContainer.EndTurn.visible = (datastore.myGame.CurrentPlayer.Id == datastore.myUser.Id);
    }

    if (datastore.myGame.SelectedCharacter && char == datastore.myGame.SelectedCharacter){
        datastore.uiContainer.Name.text = char.Name;
        datastore.uiContainer.Description.text = char.Description;
        datastore.uiContainer.AP.text = String(char.Stats.CurrentActionPoints) + " / " + String(char.Stats.FreshActionPoints);

        datastore.uiContainer.Up.visible = char.Owner == datastore.myUser.Id;
        datastore.uiContainer.Down.visible = char.Owner == datastore.myUser.Id;
        datastore.uiContainer.Right.visible = char.Owner == datastore.myUser.Id;
        datastore.uiContainer.Left.visible = char.Owner == datastore.myUser.Id;

        datastore.uiContainer.AtkUp.visible = char.Owner == datastore.myUser.Id;
        datastore.uiContainer.AtkDown.visible = char.Owner == datastore.myUser.Id;
        datastore.uiContainer.AtkRight.visible = char.Owner == datastore.myUser.Id;
        datastore.uiContainer.AtkLeft.visible = char.Owner == datastore.myUser.Id;

        //move the selected icon to this character.
        datastore.uiContainer.Selected.visible = true;
        datastore.uiContainer.Selected.position = char.Sprite.position;
    }
}

//draw the characters.
export function drawCharacters(){
    //draw some characters.
    for (let c of datastore.myGame.Characters){
        let item : PIXI.Sprite = new PIXI.Sprite();
        try {
            item = new PIXI.Sprite(datastore.sprites.find(x=>x.Name == c.Name).Sprite);
        } catch(err) {
            continue; //ignore it if we have to.
        }
        item.x = c.Position.x * 32;
        item.y = c.Position.y * 32;

        //make this interactive!
        item.interactive = true;
        item.buttonMode = true;

        item.on("mouseover", function(e){
            //hover over selected.
            datastore.uiContainer.Selector.position = item.position;
            datastore.uiContainer.Selector.visible = true;
            //if friendly, hover green. If enemy, hover red.
            if (c.Owner == datastore.myUser.Id){
                datastore.uiContainer.Selector.tint = 0x00dd00;
            } else {
                datastore.uiContainer.Selector.tint = 0xdd0000;
            }
        });
        item.on("mouseout", function(e){
           //remove selected.
           datastore.uiContainer.Selector.visible = false;
        });

        item.on('pointerdown', gameLogic.selectCharacter);
        addSprite(item, 10);
        c.Sprite = item;
    }
}

export class Effect{
    Effect : PIXI.Sprite;
    Lifespan: number =180;
    Styles: EffectStyle[] = [];
    StartPosition : {x:number, y:number};

    constructor(position:{x:number,y:number}){
        this.StartPosition = position; //always require a position be set.
    }

    public addEffect(name: string){
        let sprite = datastore.sprites.find(x=>x.Name == name);
        this.Effect = new PIXI.Sprite(sprite.Sprite);
    }

    public addStyle(velocity: {x:number,y:number} = null, acceleration: {x:number, y:number} = null, 
        delay: number = null, lifespan: number = null, startColor: number = null, endColor:number = null){
            //anything that's null is ignored.
            let style = new EffectStyle();
            style.Acceleration = acceleration;
            style.Delay = delay;
            style.ColorEnd = endColor;
            style.ColorStart = startColor;
            style.Lifespan = lifespan;
            style.Velocity = velocity;

            this.Styles.push(style);
    }

    //return the type.
    public type() : string{
        return "effect";
    }

    public render(){
        //simply add to renderer.
        this.Effect.position.x = this.StartPosition.x;
        this.Effect.position.y = this.StartPosition.y;
        addSprite(this.Effect, 50);
    }
}

export class TextEffect extends Effect{
    Effect: PIXI.Text;
    public addText(text:string){
       this.Effect = new PIXI.Text(text);
    }

    //return the type.
    public type() : string{
        return "text";
    }
}

//push an effect.
export function addEffect(name:string | null = null, text:string | null = null, char:Character | null = null, position:{x:number,y:number} | null = null,
styles: EffectStyle[] = null) {
    //if both name and text are null, error.
    if (name == null && text == null){
        addMessage("Invalid effect: No target or name specified.");
    }
    let targetPosition : {x:number, y:number};

    //char takes position.
    if (char != null){
        //find target.
        targetPosition = char.Position;
    } else if (position != null){
        targetPosition = position;
    } else {
        addMessage("Invalid target!");
        return;
    }

    //add x32 to them.
    targetPosition.x = targetPosition.x * 32;
    targetPosition.y = targetPosition.y * 32;

    //and add to the list. Woo!
    let effect;
    if (name != null){
        effect = new Effect(targetPosition);
        effect.addEffect(name);
    } else if (text != null) {
        effect = new TextEffect(targetPosition);
        effect.addText(text);
    }
    if (styles != null){
        effect.Styles = styles;
    } else {
        effect.addStyle(null, null, null, 180, 0xee0000);
    }
    effect.render();
    effects.push(effect);
}

//add a texture: A non interactive sprite.
export function addTexture(name:string, position:{x,y}){
    let sprite : SpriteContainer | undefined = datastore.sprites.find(x=>x.Name == name);
    if (sprite == undefined){
        //fail and just return for now.
        return;
    }
    let spriteC : PIXI.Sprite = new PIXI.Sprite(sprite.Sprite);

    spriteC.position.x = position.x*32;
    spriteC.position.y = position.y*32;

    addSprite(spriteC, 1);
    renderer.stage.children.sort();
}

//this is used to keep things in order.
export class SpriteHolder {
    Sprite: PIXI.Sprite;
    LayerID: number; //the higher, the closer to the screen.
}

export function addSprite(sprite: PIXI.Sprite, layerId: number) {
    let spriteH = new SpriteHolder();
    spriteH.Sprite = sprite;
    spriteH.LayerID = layerId;
    spriteHolder.push(spriteH);
    renderer.stage.addChild(sprite);
}