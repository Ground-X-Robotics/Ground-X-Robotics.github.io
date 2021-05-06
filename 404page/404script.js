function isWackyMode(){return false}
/*
Set this to true for some wacky stuff!
(you have to ctrl+s afterwards)
*/

//If running on a local machine, set to "", otherwise set it to "/". This is to make the filepaths able to run locally (for testing purposes)
var localMachine="";

//https://www.w3schools.com/graphics/game_canvas.asp
var gameArea = {
	canvas : document.createElement("canvas"),
	start : function() {
		//Canvas size
		this.canvas.width = 1080;
		this.canvas.height = 480;

		//Dimension maybe?
		this.context = this.canvas.getContext("2d");
		
		//im honestly not too sure
		document.body.insertBefore(this.canvas, document.body.childNodes[0]);

		//How often the update tick is called
		this.interval = setInterval(updateGameArea, 20);

		//Listen for keydown and keyup
		window.addEventListener('keyup', function (e) {
			//if(!e)
			//gameArea.key = false;
		})
		window.addEventListener('keydown', function (e) {
			gameArea.key = e.keyCode;
		})
	},
	//When clear is called, reset rect
	clear : function() {
	  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}
startTime = new Date().getTime();
function startGame()
{
	gameArea.start();
	gameStarted=false;

	/* 

	'new component(sx,sy,col,x,y,t)' attributes
	- The 1st and 2nd values are its scale/size
	- The 3rd value is the color/image file location (indexed from main)
	- The 4th and 5th values are its coordinates on-screen
	- The 6th value just tells it if it is an image or solid colour rectangle

	If you remove a component, jump to about line 1054~ and remove it's '.update()' counterpart,
	vice versa for adding a new element.

	*/

	//*This is the image that says "Error 404 ; Page not found" (used image because of the lack of font support)
	errortext = new component(700,200,localMachine+"404page/sprites/404.png",220,130,"image");
	//*This is the small image of the arrow keys
	arrowKeys = new component(72*3,21*3,localMachine+"404page/sprites/arrowKeys.png",5,(gameArea.canvas.height-(21*3))-5,"image");
	//*This is the player on-screen both before and after starting the game. Do not remove.
	player = new component(88,200, localMachine+"404page/sprites/spaceship.png", 80, 120, "image");
	
	
	//Death screen vvvvvvv
	blackOverlay = new component(gameArea.canvas.width, gameArea.canvas.height, "black", 0, 0);
	deathText = new text("You died!\n Score: "+score, gameArea.canvas.width/2,(gameArea.canvas.height/2)-30,"30px Courier", "white", "center");
}

class Alien
{
	//'i' is the creation ID, where the first integer is how many aliens are in its group,
	//and the second integer is what num# alien it is within its group.
	//This allows for spreading out aliens algorithmically.
	constructor(type, i=[0,0])
	{
		this.dead=false;
		this.type=type;
		this.movementType="drift";
		this.creationI=i;
		this.attackRange=175;
		this.bombDelay=5;
		this.lastTimeBomb=new Date().getTime();
		
		//Basic path, if for some reason the assignment fails, itll use this by default
		this.path=[[0,0],[gameArea.canvas.width/2,gameArea.canvas.height/2]];
		this.speed=3;

		//pain
		var sprite;
		if(type=="shifter"||type==0) 
		{
			this.speed=3;
			this.path=[
				[(gameArea.canvas.width/15) * this.creationI[0] , 0],
				[(gameArea.canvas.width/15) * this.creationI[0], gameArea.canvas.height*0.666666]
			];
			sprite=localMachine+"404page/sprites/alien1.png";
		}
		else if(type=="swinger"||type==1) 
		{
			this.speed=3;
			this.path=[
				[0, (((gameArea.canvas.height/2)/10) * this.creationI[0]) -(gameArea.canvas.height/2)],
				[gameArea.canvas.width, (((gameArea.canvas.height/2)/10) * this.creationI)-(gameArea.canvas.height/2) ]
			];
			sprite=localMachine+"404page/sprites/alien2.png";
		}
		else if(type=="oscillator"||type==2) 
		{
			this.speed=6.75;
			this.path=[
				[0, (((gameArea.canvas.height/2)/5) * (this.creationI[0]+1))],
				[gameArea.canvas.width, (((gameArea.canvas.height/2)/5) * (this.creationI[0]+1))]
			];
			sprite=localMachine+"404page/sprites/alien3.png";
		}
		else if(type=="zigzagger"||type==3) 
		{
			var splits=4;
			this.speed=3;
			this.path=[];

			for(var i=0; i<splits+2; i++)
			{
				this.path[i]=[gameArea.canvas.width/splits * i,gameArea.canvas.height*(i%2)]
				this.path[(i+splits+2)]=[gameArea.canvas.width/splits * i,gameArea.canvas.height*(i%2)]
			}

			sprite=localMachine+"404page/sprites/alien4.png";
		}
		else if(type=="cosiner"||type==4) 
		{
			this.speed=5;
			this.movementType="exact";
			sprite=localMachine+"404page/sprites/alien5.png";

			this.path=[];
			var x=0;
			for(var i=0; i<gameArea.canvas.width/4; i++)
			{
				this.path[i]=[x,(Math.cos((x/80))*90)+gameArea.canvas.height/2];
				x+=4;
			}	
		}
		else if(type=="siner"||type==5) 
		{
			this.speed=5;
			this.movementType="exact";
			sprite=localMachine+"404page/sprites/alien6.png";

			this.path=[];
			var x=0;
			for(var i=0; i<gameArea.canvas.width/4; i++)
			{
				this.path[i]=[x,(Math.cos((x/80)+180)*90)+gameArea.canvas.height/2];
				x+=4;
			}
		}
		else if(type=="bungee"||type==6) 
		{
			this.movementType="exact"
			this.speed=3;
			sprite=localMachine+"404page/sprites/alien7.png";

			this.path=[];
			var x=0;
			for(var i=0; i<gameArea.canvas.width/2; i++)
			{
				this.path[i]=[x-gameArea.canvas.width/2,   ((-(((gameArea.canvas.width-x)*(gameArea.canvas.width-x))/(gameArea.canvas.width/2)))+gameArea.canvas.height)-22     ];
				x+=4;
			}
		}
		else if(type=="homer"||type==7)
		{
			this.movementType="homing";
			this.speed=3.3;
			this.path=[[0,0],[gameArea.canvas.width,gameArea.canvas.height]];
			sprite=localMachine+"404page/sprites/alien8.png";
		}
		else if(type=="swiper"||type==8)
		{
			this.movementType="swiper";
			this.speed=7;
			this.path=[[0,0],[gameArea.canvas.width,gameArea.canvas.height]];
			sprite=localMachine+"404page/sprites/alien9.png";

			this.path[0][0]=0;
			this.path[0][1]=Math.random()*gameArea.canvas.height;
		}
		//its moments like this i wish javascript had enums and dictionaries, or maybe it does and im just noob
		//too bad!

		this.sprite=new component(22,22, sprite, gameArea.canvas.width/2, 120, "image");
		this.hp=100;

		this.creationTime=new Date().getTime();

		this.targetPoint=0;
		this.sprite.x=this.path[0][0];
		this.sprite.y=this.path[0][1]-700;
		
		//Increments the alien's path by one tick.
		this.incrementPath = function()
		{
			if(this.movementType=="drift")
			{
				//Temp vars
				this.currentX=this.sprite.x;
				this.currentY=this.sprite.y;
				this.targetX=this.path[this.targetPoint][0];
				this.targetY=this.path[this.targetPoint][1];

				//Gets the angle from the current point to the target point
				this.angle = Math.atan2(this.currentY-this.targetY,this.currentX-this.targetX);
				
				//Moves the alien along the angle vector by a factor of the speed
				this.sprite.x-=Math.cos(this.angle)*this.speed;
				this.sprite.y-=Math.sin(this.angle)*this.speed;
				
				var dist = Math.sqrt((this.currentX-this.targetX)*(this.currentX-this.targetX)) + ((this.currentY-this.targetY)*(this.currentY-this.targetY))

				//If it has met its target position (near enough met it)
				if(dist < 10)
				{
					this.targetPoint+=1;//Increment target position
					this.targetPoint=this.targetPoint%this.path.length;//If it overflows the length of the list, loop back round
				}
			}
			else if(this.movementType=="exact")
			{
				this.sprite.x=this.path[this.targetPoint][0];
				this.sprite.y=this.path[this.targetPoint][1];
				this.targetPoint+=1;//Increment target position
				this.targetPoint=this.targetPoint%this.path.length;//If it overflows the length of the list, loop back round
			}
			else if(this.movementType=="homing")
			{
				//Temp vars
				this.currentX=this.sprite.x;
				this.currentY=this.sprite.y;

				//Gets the angle from the current point to the target point
				this.angle = Math.atan2(this.currentY-player.y,this.currentX-player.x);
				
				//Moves the alien along the angle vector by a factor of the speed
				this.sprite.x-=Math.cos(this.angle)*this.speed;
				this.sprite.y-=Math.sin(this.angle)*this.speed;
			}
			if(this.movementType=="swiper")
			{
				//Temp vars
				this.currentX=this.sprite.x;
				this.currentY=this.sprite.y;
				
				//Moves the alien along the angle vector by a factor of the speed
				this.sprite.x+=this.speed;

				//If it has met its target position (near enough met it)
				if(this.sprite.x>gameArea.canvas.width)
				{
					this.sprite.x=0;
					this.sprite.y=Math.random()*gameArea.canvas.height;
				}
			}
			
			
			//Drop bomb
			if(new Date().getTime() - this.lastTimeBomb > this.bombDelay*1000)
			{
				if(player.x > this.sprite.x-this.attackRange && player.x < this.sprite.x+this.attackRange)
				{
					if(Math.round(Math.random()*1)==0)
					{
						dropBombFrom(this);
					}
				}
				this.lastTimeBomb= new Date().getTime();
			}
		}
	}
}

//Please use this instead of aliens[i]=new Alien()
//It *should* eliminate the memory leak for aliens[]
function makeAlien(type,creationI=[0,0])
{
	for(var i=0; i<aliens.length; i++)
	{
		if(aliens[i].dead)
		{
			var newAlien = new Alien(type,creationI);
			aliens[i]=newAlien;
			return newAlien;
		}
	}

	var newAlien = new Alien(type,creationI)
	aliens[aliens.length]=newAlien;
	return newAlien;
}

var aliens=[];
var waveCheck=[];
var waveComplete=[];
var stars=[];
var livesDisplay=[];
var lives=3;
var score=0;
var hurtTime=1500;
function hurtPlayer(amt=1)
{
	if(hurtCooldown>hurtTime)
	{
		new Audio(localMachine+'404page/sounds/hurt.wav').play();

		livesDisplay.pop();
		lives-=amt;

		playHurtAnimation=true;
		hurtAnimationStartTime= new Date().getTime();
		hurtCooldown=0;
	}
}


var pickups=[];
class Pickup
{
	constructor(i,x,y)
	{
		this.type=i;
		this.destroyed=false;

		var newSprite=localMachine+"404page/sprites/gunSingle.png"
		if(i==1) newSprite=localMachine+"404page/sprites/gunDouble.png";
		else if(i==2) newSprite=localMachine+"404page/sprites/gunLaser.png";
		else if(i==3) newSprite=localMachine+"404page/sprites/gunWipe.png"

		this.sprite=new component(33,33, newSprite, x, y, "image")
		this.sprite.speedY=3;
	}
}
function updatePickups()
{
	for(var i=0; i<pickups.length; i++)
	{
		if(!pickups[i].destroyed)
		{	
			pickups[i].sprite.y+=pickups[i].sprite.speedY;

			pickups[i].sprite.update();

			if(pickups[i].y>gameArea.canvas.height)
			{
				pickups[i].destroyed=true;
			}
		}
		else
		{
			pickups[i].sprite.x=-gameArea.canvas.width;
			pickups[i].sprite.x=-gameArea.canvas.height;
		}
	}
}
function createPickup(i,x,y)
{
	var newPickup = new Pickup(i,x,y);
	for(var i=0; i<pickups.length; i++)
	{
		if(pickups[i].destroyed)
		{
			pickups[i]=newPickup;
			return newPickup;
		}
	}

	pickups[pickups.length]=newPickup;
	return newPickup;
}
function dropPickup()
{
	var randomNum = Math.floor(Math.random()*3)+1; //Random number from 1 to 2 ( r(0,1) then add 1)
	createPickup(randomNum,Math.random()*gameArea.canvas.width,0);
}



var bullets=[];
var bulletCooldown=0;

class Gun
{
	constructor(name, firedelay, damage, speed, durability=100, color, length, beams, spread)
	{
		this.name=name;
		this.firedelay=firedelay;
		this.damage=damage;
		this.speed=speed;
		this.durability=durability;
		this.color=color;
		this.length=length;
		this.beams=beams;
		this.spread=spread;
	}
}
var gun=[
	//name, firedelay, damage, speed, durability, colour, length, beam count, spread
	new Gun("laser", 500, 1, 20, 999999999999,'#FF0000', 15, 1,1),
	new Gun("double laser", 250, 10, 20, 50, '#00FF00', 15, 2,1),
	new Gun("ionic beam", 0, 1, 50, 80, '#FFFF00', 55, 1,1),
	new Gun("wipe", 750, 999, 25, 10, '#FFFFFF', 10, 1, 37),
	new Gun("old laser", 100, 10, 20, 200, '#00FF00', 15, 2,1),
	new Gun("trans beam", 0, 999, 50, 99999999999999999999999999, '#FFFFFF', 55, 5,1),
]
var gunType = 0;
var currentDurability=gun[gunType].durability;
var playFlashAnimation=false;
var animationStartTime= new Date().getTime();
var playHurtAnimation=false;
var hurtAnimationStartTime= new Date().getTime();
var hurtCooldown=0;





//AABB collision
//https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
function checkForCollision(objectA, objectB)
{
	//Init vars
	var spriteA=[];
	var spriteB=[];
	var collisions=[];

	/*
	Makes sure it is operating on the sprite, as to not cause an issues
	This also allows it to return the Object instead of only the sprite
	Helping with operations on objects of collisions
	*/
	/*
	Also all the fancy isArray and for loop stuff just allows it to take in arrays and
	test against each object in the array. Makes stuff easier for testing against the aliens, bullets and pickups.
	
	You can pass arrays into either objectA or objectB and it will return all the collisions. Due to the way javascript
	works you can do if(array) and it will return true still.
	*/
	/*I am very proud of this system lol*/
	if(Array.isArray(objectA))
	{
		for(var i=0; i<objectA.length; i++)
		{
			if(typeof objectA[i]=='undefined')
				return false;
			
			if(objectA[i] instanceof Alien || objectA[i] instanceof Pickup)
				spriteA[i]=objectA[i].sprite;
			else
				spriteA[i]=objectA[i];
		}
	}
	else
	{
		if(objectA instanceof Alien || objectA instanceof Pickup)
			spriteA[0]=objectA.sprite;
		else
			spriteA[0]=objectA;
	}
	
	if(Array.isArray(objectB))
	{
		for(var i=0; i<objectB.length; i++)
		{
			if(typeof objectB[i]=='undefined')
				return false;

			if(objectB[i] instanceof Alien || objectB[i] instanceof Pickup)
				spriteB[i]=objectB[i].sprite;
			else
				spriteB[i]=objectB[i];
		}
	}
	else
	{
		if(objectB instanceof Alien || objectB instanceof Pickup)
			spriteB[0]=objectB.sprite;
		else
			spriteB[0]=objectB;
	}
	
	
	

	for(var a=0; a<spriteA.length; a++)
		for(var b=0; b<spriteB.length; b++)
		{
			//if(typeof objectA[a]=='undefined' || typeof objectB[b]=='undefined')
			//	return false;
			

			var rect1={x: spriteA[a].x, y: spriteA[a].y, width: spriteA[a].width, height: spriteA[a].height}
			var rect2={x: spriteB[b].x, y: spriteB[b].y, width: spriteB[b].width, height: spriteB[b].height}

			if (rect1.x < rect2.x + rect2.width &&
				rect1.x + rect1.width > rect2.x &&
				rect1.y < rect2.y + rect2.height &&
				rect1.y + rect1.height > rect2.y
			)
			{
				collisions[collisions.length]=objectB[b];
			}
		}
	
	if(collisions.length>0)
		return collisions;
	else
		return false;
}

function generateStars()
{
	for(var i=0; i<30; i++)
	{
		var newScaleRandom = Math.random(); //Make the scale random
		var newSize = (newScaleRandom*3)+1.5; //Scale size

		//Stars that scale from black and white
		//// var H = ((Math.random()*220)+35).toString(16); //Choose random number from 35 to 255, and convert it to hex
		//// var H = H[0] + H[1] //Round the hex to the first two characters
		//// var hex = '#'+H+H+H; //Combine into a full hex, makes a greyscale with a brightness from 35 to 255
		
		var R = ((Math.random()*220)+35).toString(16); //Choose random number from 35 to 255, and convert it to hex for R
		var G = ((Math.random()*220)+35).toString(16); //Choose random number from 35 to 255, and convert it to hex for G
		var B = ((Math.random()*220)+35).toString(16); //Choose random number from 35 to 255, and convert it to hex for B
		var hex = '#'+R[0]+R[1]+G[0]+G[1]+B[0]+B[1]; //Convert to a single hex string


		stars[i]=new component(newSize,newSize, hex, Math.random()*gameArea.canvas.width, Math.random()*gameArea.canvas.height);
		stars[i].speedY = (Math.random()*7)+3;
	}
}

function updateStars()
{
	for(var i=0; i<stars.length; i++)
	{
		stars[i].y+=stars[i].speedY;

		if(stars[i].y>gameArea.canvas.height)
		{
			stars[i].y=0;
			stars[i].x=Math.floor(Math.random()*gameArea.canvas.width);
		}

		stars[i].update();
	}
}

function updateBullets()
{
	//"Yes, this causes a memory leak. Too bad!"
	//I cant null the bullets or remove them from the list because js handles arrays annoyingly.
	//If it supported lists, this would be literally infinitely better

	//Maybe one day ill think of a way to fix it, might implement a similar system to the aliens
	for(var i=0; i<bullets.length; i++)
	{
		if(bullets[i]!=null)
		{
			bullets[i].y-=bullets[i].speedY;

			


			if(bullets[i].y>-bullets[i].height)
				if(bullets[i].active)
					bullets[i].update();
		}
	}
}

function updateLives()
{
	for(var i =0; i<livesDisplay.length; i++)
	{
		livesDisplay[i].update();
	}
}

function updateAliens()
{
	for(var i=0; i<aliens.length; i++)
	{
		if(!aliens[i].dead)
		{
			aliens[i].incrementPath();
			aliens[i].sprite.update();
		}
		else
		{
			//Teleports them away so they cant collide with anything even though theyre dead
			aliens[i].sprite.x=-gameArea.canvas.width;
			aliens[i].sprite.y=-gameArea.canvas.height;
		}
	}

}
function lerpFlash()
{
	if(flash.alpha<0)
	{
		flash.alpha=0;
		playFlashAnimation=false;
		
		return;
	}
	
	var length=200;
	var time = new Date().getTime();

	var lerp = (time-animationStartTime) / length;

	//Animation curve/graph/line thingy
	var alpha= -Math.abs(lerp -0.5) +0.5;

	flash.alpha=alpha;
}
function lerpHurt()
{
	if(hurtFlash.alpha<0)
	{
		hurtFlash.alpha=0;
		playHurtAnimation=false;
		
		return;
	}
	
	var length=200;
	var time = new Date().getTime();

	var lerp = (time-hurtAnimationStartTime) / length;

	//Animation curve/graph/line thingy
	var alpha= -Math.abs(lerp -0.5) +0.5;

	hurtFlash.alpha=alpha;
}

function changeGunTo(gunNum, playAnimation=true)
{
	gunType=gunNum;
	currentDurability=gun[gunNum].durability;
	
	if(playAnimation)
	{
		new Audio(localMachine+'404page/sounds/pickup.wav').play();
		playFlashAnimation=true;
		animationStartTime= new Date().getTime();
	}
}
function shootGun(player)
{
	var newAudio = new Audio('/404page/sounds/shoot.wav');
	newAudio.volume=0.1;
	newAudio.play();
	var len = bullets.length;
	var currentGun = gun[gunType];
	var beamCount=currentGun.beams+1;
	var bulletSpread=currentGun.spread;

	if(gun[gunType].name=="trans beam")
	{	
		for(var i=1; i<6; i++)
		{	
			var colour='#FFFFFF';
			if(i==1||i==5) colour='#42bff5'
			else if(i==2||i==4) colour='#ff91e9'
			else if(i==3) colour='#FFFFFF'
			bullets[len+(i-1)] = new component(8, currentGun.length, colour, (player.x+((player.width*2/(beamCount))*i))-((player.width/2)+4), player.y);
			bullets[len+(i-1)].speedY=currentGun.speed;
		}
	}
	// else if(gun[gunType].name=="shotgun")
	// {
		
	// }
	else
	{
		for(var i=1; i<beamCount; i++)
		{
			bullets[len+(i-1)] = new component(3*bulletSpread, currentGun.length, currentGun.color, player.x+((player.width/beamCount)*i)-((3*bulletSpread)/2), player.y);
			bullets[len+(i-1)].speedY=currentGun.speed;
		}
	}
		
	bulletCooldown=0;
	currentDurability-=1;
}

function component(width, height, color, x, y, type) {
	this.type = type;
	this.active=true;
	if (type == "image") {
		this.image = new Image();
		this.image.src = color;
	}
	if(type == "text")
	{
		this.text = color;
	}
	this.width = width;
	this.height = height;
	this.speedX = 0;
	this.speedY = 0;
	this.alpha=1;
	this.starSize;
	this.x = x;
	this.y = y;
	this.update = function() {
		ctx = gameArea.context;
		if (type == "image") {
		ctx.drawImage(this.image,
			this.x,
			this.y,
			this.width, this.height);
		} else {
		ctx.fillStyle = color;
		ctx.globalAlpha = this.alpha;
		ctx.fillRect(this.x, this.y, this.width, this.height);
		}
	}
}
function text(text, x, y, font, color, align="center") {
	this.alpha=1;
	this.text=text;
	this.x = x;
	this.y = y;
	this.update = function() {
		ctx = gameArea.context;
		ctx.font=font;
		ctx.fillStyle = color;
		ctx.textAlign=align;
		ctx.fillText(this.text,x,y);
	}
}


//Used to store the keys held
var map={};
var totalMovement=0;
var speed=7;
function updateGameArea() 
{
	var time = new Date();
	timer=time.getTime();
	gameArea.clear();

	//https://stackoverflow.com/questions/16089421/simplest-way-to-detect-keypresses-in-javascript
	//Puts the keys into an enum array thing
	//Keycode:bool
	onkeydown = onkeyup = function(e)
	{
		e=e||event; //IE support (not like it works anyway)
		map[e.keyCode]=e.type=='keydown';
	}

	//KEY INPUT
	if(player.active)
	{ 
		//37=Left, 39=Right, 38=Down, 40=Up, 32=Space
		if(map[37])	{
			if(player.x>4)
				player.x-=speed;
			totalMovement+=speed;
		}
		if(map[39]){
			if(!(player.x+player.width>gameArea.canvas.width-4))
				player.x+=speed;
			totalMovement+=speed;
		}
		if(map[40]){
			if(!(player.y+player.height>gameArea.canvas.height-4))
				player.y+=speed;
			totalMovement+=speed;
		}
		if(map[38]){
			if(player.y>4)
				player.y-=speed;
			totalMovement+=speed;
		}
		if(map[32]){
			if(bulletCooldown>=gun[gunType].firedelay && currentDurability>0)
				shootGun(player);
		}
	}

	//first wave init
	if(!gameStarted && totalMovement>100)
	{
		startTime = new Date().getTime();

		player.width=22;
		player.height=50;
		speed=7;

		var e=[];
		var n=[];
		/*
		Have to use individual e[x] variables for each sub-wave because of the way setTimeout works with js
		It essentially processes the setTimeout() queue at the end of the tick (simplified), 
		and since it can't access a variable used in a for loop at the time of it being added to the queue, 
		you have to use a separate variable so that it can increment upwards when it actually needs to process them.

		Same goes for n[x], thats how many it will spawn
		
		Neg: memory
		Pro: cool looking waves B)
			 And being able to actually time stuff, pretty necessary.
		*/
		
		//Alien structures
		setTimeout(
			function()
			{
				n[0]=15;
				e[0]=0;
				for(var i=0; i<n[0]; i++)
				{	
					setTimeout(
						function()
						{
							makeAlien(0,[e[0],n[0]]);
							e[0]++;
						},
						//Timeout for each individual alien within the wave
						100*i
					);
				}
			},
			//Timeout until wave starts
			0
		);

		n[1]=5;
		e[1]=0;
		setTimeout(
			function()
			{
				for(var i=0; i<n[1]; i++)
				{	
					setTimeout(
						function()
						{
							makeAlien(2,[e[1],n[1]]);
							e[1]++;
						}, 
						//Timeout for each individual alien within the wave
						500*i
					);
				}
			},
			//Timeout until wave starts
			20*1000
		);
		
		for(var wavenum=0; wavenum<10; wavenum++)
		{
			setTimeout(
				function()
				{	
					n[2]=5;
					e[2]=0;
					setTimeout(
						function()
						{
							for(var i=0; i<n[2]; i++)
							{	
								setTimeout(
									function()
									{
										makeAlien(3,[e[2],n[2]]);
										e[2]++;
									}, 
									1000*i
								);
							}
						},
						30*1000
					);
		
					n[3]=5;
					e[3]=0;
					setTimeout(
						function()
						{
							for(var i=0; i<n[3]; i++)
							{	
								setTimeout(
									function()
									{
										makeAlien(7,[e[3],n[3]]);
										e[3]++;
									}, 
									1000*i
								);
							}
						},
						40*1000
					);
					
					n[4]=5;
					e[4]=0;
					setTimeout(
						function()
						{
							for(var i=0; i<n[4]; i++)
							{	
								setTimeout(
									function()
									{
										makeAlien(1,[e[4],n[4]]);
										e[4]++;
									}, 
									1000*i
								);
							}
						},
						50*1000
					);
					
					n[5]=5;
					e[5]=0;
					setTimeout(
						function()
						{
							for(var i=0; i<n[5]; i++)
							{	
								setTimeout(
									function()
									{
										makeAlien(4,[e[5],n[5]]);
										makeAlien(5,[e[5],n[5]]);
										e[5]++;
									}, 
									1000*i
								);
							}
						},
						60*1000
					);
					
					n[6]=10;
					e[6]=0;
					setTimeout(
						function()
						{
							for(var i=0; i<n[6]; i++)
							{	
								setTimeout(
									function()
									{
										makeAlien(6,[e[6],n[6]]);
										e[6]++;
									}, 
									1000*i
								);
							}
						},
						65*1000
					);
					
					n[7]=10;
					e[7]=0;
					setTimeout(
						function()
						{
							for(var i=0; i<n[7]; i++)
							{	
								setTimeout(
									function()
									{
										makeAlien(8,[e[7],n[7]]);
										e[7]++;
									}, 
									1000*i
								);
							}
						},
						85*1000
					);
		
					n[8]=20;
					e[8]=0;
					setTimeout(
						function()
						{
							for(var i=0; i<n[8]; i++)
							{	
								setTimeout(
									function()
									{
										makeAlien(0,[e[8],n[8]]);
										e[8]++;
									}, 
									500*i
								);
							}
						},
						70*1000
					);
		
					setTimeout(
						function()
						{
							waveCheck[0]=true;
						},
						70*1000
					)
				},
				85*1000*wavenum
			);
		}
		
		for(var i=0; i<lives; i++)
		{
			livesDisplay[i]=new component((11*1.5),25*1.5,localMachine+"404page/sprites/spaceship.png",5+(i*11*1.5),(gameArea.canvas.height-(25*1.5))-5,"image")
		}

		generateStars();
		flash = new component(gameArea.canvas.width,gameArea.canvas.height, "white", 0, 0)
		flash.alpha=0;
		
		hurtFlash = new component(gameArea.canvas.width,gameArea.canvas.height, "red", 0, 0)
		hurtFlash.alpha=0;

		ammo = new text(currentDurability, gameArea.canvas.width-5,35,"30px Courier", "red", "right");

		scoreText = new text(getScore(), 5,35,"30px Courier", "red", "left");

		gameStarted=true;
	}

	




	//This isnt pretty, but its the most simple way i can think of doing it, plus there shouldnt be much of a performance impact
	//I have to keep the rendering in that order, but some should only render when the game is active, aaaaaaaaaa
	if(!gameStarted)
	{
		errortext.update();
		arrowKeys.update();
	}
	if(gameStarted)	
	{
		var dropDelay = 20000; //Every x milliseconds, a pickup is dropped
		var dropTimeout=(new Date().getTime()-startTime)%dropDelay

		if(dropTimeout<20)
		{
			dropPickup();
		}

		if(currentDurability<=0)
			changeGunTo(0, false);
		
		var collision = checkForCollision(player, aliens);
		if(collision && player.active)
		{
			
			if(hurtCooldown>hurtTime)
			{
				collision[0].dead=true;
				collision[0].sprite.active=false;
			}
			hurtPlayer();
		}

		var alienBulletCollisions = checkForCollision(bullets, aliens);
		if(alienBulletCollisions)
			for(var i=0; i<alienBulletCollisions.length; i++)
			{
				//var bulletColl = checkForCollision(alienBulletCollisions[i], bullets);
				//bulletColl.active=false;

				alienBulletCollisions[i].dead=true;
				alienBulletCollisions[i].sprite.active=false;
				score+=200;

				var newAudio = new Audio(localMachine+'404page/sounds/enemyHurt.wav');
				newAudio.volume=0.25;
				newAudio.play();
			}

		var pickupCollisions = checkForCollision(player, pickups);
		if(pickupCollisions)
			for(var i=0; i<pickupCollisions.length; i++)
			{
				changeGunTo(pickupCollisions[i].type);
				pickupCollisions[i].destroyed=true;
			}

		var bombCollisions = checkForCollision(player, alienBombs);
		if(bombCollisions)
		{
			for(var i=0; i<bombCollisions.length; i++)
			{
				hurtPlayer();
				bombCollisions[i].active=false;
			}
		}

		var bombBulletCollisions = checkForCollision(bullets, alienBombs);
		if(bombBulletCollisions)
		{
			for(var i=0; i<bombBulletCollisions.length; i++)
			{
				bombBulletCollisions[i].active=false;
			}
		}

		updateStars();
		updatePickups();
		updateAliens();
		updateBullets();
		updateBombs();
	}





	if(player.active)
		player.update();

	if(playFlashAnimation && gameStarted)
		lerpFlash();
	
	if(playHurtAnimation && gameStarted)
		lerpHurt();

	//UI
	if(gameStarted)
	{
		updateLives();

		var ammoText;
		if(currentDurability>9999)
			ammoText="Inf";
		else
			ammoText=currentDurability;
		ammo.text=ammoText;
		ammo.update();
		scoreText.text=getScore();
		scoreText.update();

		if(flash.alpha>0)
			flash.update();
		
		if(hurtFlash.alpha>0)
			hurtFlash.update();
		

		if(lives<0 && lives>-5)
		{	
			player.active=false;
			
			score=getScore();

			setTimeout(
				function()
				{
					location.reload();
				},
				10*1000
			);

			//So it doesnt die more than once in a frame
			lives-=999;
		}









		//Wave checking
		if(waveCheck[0] && allAliensDead())
		{
			console.log("wave complete")
			startWave(1);
			waveCheck[0]=false;
		}
	}
	
	if(!player.active)
	{
		deathText.text="You died!\n Score: "+score;
		blackOverlay.update();
		deathText.update();
	}

	bulletCooldown+=20;
	hurtCooldown+=20;


	if(isWackyMode())
	{
		gunType=5;
	}
}

alienBombs=[];
function dropBombFrom(alien)
{
	var newBomb = new component(15,15,localMachine+"404page/sprites/bomb.png", alien.sprite.x + (alien.sprite.width/2), alien.sprite.y,"image")
	newBomb.speedY = 5;
	
	//alienBombs[alienBombs.length] = newBomb;
	
	if (alienBombs.length==0) alienBombs[0]=newBomb;
	else
	{
		for(var i=0; i<alienBombs.length; i++)
		{
			if(!alienBombs[i].active)
			{
				alienBombs[i]=newBomb;
				return;
			}
		}

		//If it didnt find and inactive bombs, make a new one.
		alienBombs[alienBombs.length] = newBomb;
	}
}

function updateBombs()
{
	for(var i=0; i<alienBombs.length; i++)
	{
		if(alienBombs[i].y > gameArea.canvas.height)
		alienBombs[i].active=false;

		if(alienBombs[i].active)
		{
			alienBombs[i].update();
			alienBombs[i].y+=alienBombs[i].speedY;
		}
		else
		{
			alienBombs[i].y= - gameArea.canvas.height;
		}
	}
}

function allAliensDead()
{
	for(var i=0; i<aliens.length; i++)
	{
		if(!aliens[i].dead)
			return false;
	}
	return true;
}

function startWave(waveNum)
{
	if(waveNum==1)
	{
		console.log("Started wave "+waveNum);
		n[2]=10;
		e[2]=0;
		setTimeout(
			function()
			{
				for(var i=0; i<n[2]; i++)
				{	
					setTimeout(
						function()
						{
							makeAlien(3,[e[2],n[2]]);
							e[2]++;
						}, 
						1000*i
					);
				}
			},
			10*1000
		);
	}
}

function getScore() { return score+Math.round((new Date().getTime() - startTime)/10); }
