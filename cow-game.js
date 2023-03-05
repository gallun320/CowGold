var directions = {
    west: { offset: 0, x: -2, y: 0, opposite: 'east' },
    northWest: { offset: 32, x: -2, y: -1, opposite: 'southEast' },
    north: { offset: 64, x: 0, y: -2, opposite: 'south' },
    northEast: { offset: 96, x: 2, y: -1, opposite: 'southWest' },
    east: { offset: 128, x: 2, y: 0, opposite: 'west' },
    southEast: { offset: 160, x: 2, y: 1, opposite: 'northWest' },
    south: { offset: 192, x: 0, y: 2, opposite: 'north' },
    southWest: { offset: 224, x: -2, y: 1, opposite: 'northEast' }
};


var anims = {
    idle: {
        startFrame: 0,
        endFrame: 4,
        speed: 0.2
    },
    walk: {
        startFrame: 4,
        endFrame: 12,
        speed: 0.15
    },
    attack: {
        startFrame: 12,
        endFrame: 20,
        speed: 0.11
    },
    die: {
        startFrame: 20,
        endFrame: 28,
        speed: 0.2
    },
    shoot: {
        startFrame: 28,
        endFrame: 32,
        speed: 0.1
    }
};


var cow;

var tileWidthHalf;
var tileHeightHalf;

var d = 0;

var scene;

// GameObject Cow
// class Cow extends Phaser.GameObjects.Image {
//     constructor(scene, x, y, motion, direction, distance) {
//         const directionObj = directions[direction];
//         super(scene, x, y, 'cow', directionObj.offset);
//         console.log(directionObj, directionObj.offset, this.texture);
//         this.startX = x;
//         this.startY = y;
//         this.distance = distance;

//         this.motion = motion;
//         this.anim = anims[motion];
//         this.direction = directionObj;
//         this.speed = 0.15;
//         this.f = this.anim.startFrame;

//         this.depth = y + 64;

//         scene.time.delayedCall(this.anim.speed * 1000, this.changeFrame, [], this);
//     }

//     changeFrame ()
//     {
//         this.f++;

//         var delay = this.anim.speed;

//         if (this.f === this.anim.endFrame)
//         {
//             switch (this.motion)
//             {
//                 case 'walk':
//                     this.f = this.anim.startFrame;
//                     this.frame = this.texture.get(this.direction.offset + this.f);
//                     scene.time.delayedCall(delay * 1000, this.changeFrame, [], this);
//                     break;

//                 case 'attack':
//                     delay = Math.random() * 2;
//                     scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
//                     break;

//                 case 'idle':
//                     delay = 0.5 + Math.random();
//                     scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
//                     break;

//                 case 'die':
//                     delay = 6 + Math.random() * 6;
//                     scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
//                     break;
//             }
//         }
//         else
//         {
//             this.frame = this.texture.get(this.direction.offset + this.f);

//             scene.time.delayedCall(delay * 1000, this.changeFrame, [], this);
//         }
//     }

//     resetAnimation ()
//     {
//         this.f = this.anim.startFrame;

//         this.frame = this.texture.get(this.direction.offset + this.f);

//         scene.time.delayedCall(this.anim.speed * 1000, this.changeFrame, [], this);
//     }

//     update ()
//     {
//         if (this.motion === 'walk')
//         {
//             this.x += this.direction.x * this.speed;

//             if (this.direction.y !== 0)
//             {
//                 this.y += this.direction.y * this.speed;
//                 this.depth = this.y + 64;
//             }

//             //  Walked far enough?
//             if (Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y) >= this.distance)
//             {
//                 this.direction = directions[this.direction.opposite];
//                 this.f = this.anim.startFrame;
//                 this.frame = this.texture.get(this.direction.offset + this.f);
//                 this.startX = this.x;
//                 this.startY = this.y;
//             }
//         }
//     }
// }

const map = (value, min, max, newMin, newMax) => {
    return ((value - min) / (max - min)) * (newMax - newMin) + newMin;
  };

class Cow extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, motion, direction, navMesh) {
        super(scene, x, y, 'cow', direction.offset);
        this.startX = x;
        this.startY = y;
        this.distance = Phaser.Math.Distance.Between(this.startX, this.startY, direction.x, direction.y);
        this.motion = motion;
        this.anim = anims[motion];
        this.direction = direction;
        this.speed = 0.15;
        this.f = this.anim.startFrame;
        this.navMesh = navMesh;
        this.path = null;
        this.currentTarget = null;

        this.depth = y + 64;
        scene.physics.world.enable(this);
        this.timerEvent = scene.time.delayedCall(this.anim.speed * 1000, this.changeFrame, [], this);
    }

    changeFrame ()
    {
        this.f++;

        var delay = this.anim.speed;
        if(!this.timerEvent)
            return;

        if (this.f === this.anim.endFrame)
        {
            switch (this.motion)
            {
                case 'walk':
                    this.f = this.anim.startFrame;
                    this.frame = this.texture.get(this.direction.offset + this.f);
                    this.timerEvent = scene.time.delayedCall(delay * 1000, this.changeFrame, [], this);
                    break;

                case 'attack':
                    delay = Math.random() * 2;
                    this.timerEvent = scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                    break;

                case 'idle':
                    delay = 0.5 + Math.random();
                    this.timerEvent = scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                    break;

                case 'die':
                    delay = 6 + Math.random() * 6;
                    this.timerEvent = scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                    break;
            }
        }
        else
        {
            this.frame = this.texture.get(this.direction.offset + this.f);

            scene.time.delayedCall(delay * 1000, this.changeFrame, [], this);
        }
    }

    resetAnimation ()
    {
        this.f = this.anim.startFrame;

        this.frame = this.texture.get(this.direction.offset + this.f);

        this.timerEvent = scene.time.delayedCall(this.anim.speed * 1000, this.changeFrame, [], this);
    }

    goTo(targetPoint) {
        // Find a path to the target
        this.path = this.navMesh.findPath(new Phaser.Math.Vector2(this.x, this.y), targetPoint);
        console.log(this.path, this.path.shift(), this.path && this.path.length > 0);
    
        // If there is a valid path, grab the first point from the path and set it as the target
        if (this.path && this.path.length > 0) 
        {
            this.currentTarget = this.path.shift();
            this.motion = 'walk';
            this.anim = anims[this.motion];
            this.timerEvent.destroy();
            this.resetAnimation();
        }
        else this.currentTarget = null;
    }

    update(time, deltaTime) {
        // Bugfix: Phaser's event emitter caches listeners, so it's possible to get updated once after
        // being destroyed
        if (!this.body) return;
    
        // Stop any previous movement
        this.body.velocity.set(0);
    
        if (this.currentTarget) {
          // Check if we have reached the current target (within a fudge factor)
          const { x, y } = this.currentTarget;
          const distance = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    
          if (distance < 5) {
            // If there is path left, grab the next point. Otherwise, null the target.
            if (this.path.length > 0) this.currentTarget = this.path.shift();
            else this.currentTarget = null;
          }
    
          // Slow down as we approach final point in the path. This helps prevent issues with the
          // physics body overshooting the goal and leaving the mesh.
          let speed = 400;
          if (this.path.length === 0 && distance < 50) {
            speed = map(distance, 50, 0, 400, 50);
          }
    
          // Still got a valid target?
          if (this.currentTarget) 
          {
            this.moveTowards(this.currentTarget, speed, deltaTime / 1000);
          }
          else if(this.motion !== 'idle'){
            this.motion = 'idle';
            this.anim = anims[this.motion];
            this.timerEvent.destroy();
            this.resetAnimation();
          }
        }
    }
    
    moveTowards(targetPosition, maxSpeed = 200, elapsedSeconds) {
        const { x, y } = targetPosition;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, x, y);
        const distance = Phaser.Math.Distance.Between(this.x, this.y, x, y);
        const targetSpeed = distance / elapsedSeconds;
        const magnitude = Math.min(maxSpeed, targetSpeed);
    
        this.scene.physics.velocityFromRotation(angle, magnitude, this.body.velocity);
        this.depth = y + 64;
    }

    // update ()
    // {
    //     if (this.motion === 'walk')
    //     {
    //         this.x += this.direction.x * this.speed;

    //         if (this.direction.y !== 0)
    //         {
    //             this.y += this.direction.y * this.speed;
    //             this.depth = this.y + 64;
    //         }

    //         //  Walked far enough?
    //         if (Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y) >= this.distance)
    //         {
    //             this.motion = "idle";
    //             this.anim = anims[this.motion];
    //             this.f = this.anim.startFrame;
    //             this.frame = this.texture.get(this.direction.offset + this.f);
    //             this.startX = this.x;
    //             this.startY = this.y;
    //         }
    //     }
    // }

    walk(direction) 
    {
        this.motion = 'walk';
        this.direction = direction;
        this.anim = anims[this.motion];
        this.startX = this.x;
        this.startY = this.y;
        console.log(Phaser.Math.Distance.Between(this.startX, this.startY, direction.x, direction.y));
        this.distance = Phaser.Math.Distance.Between(this.startX, this.startY, direction.startX, direction.startY);
        this.resetAnimation();
    }
}

class CowLandScene extends Phaser.Scene
{
    constructor ()
    {
        super();
    }

    preload ()
    {
        this.load.json('map', 'assets/isometric-grass-and-water-worked.json');
        this.load.tilemapTiledJSON('map', 'assets/isometric-grass-and-water-worked.json');
        this.load.spritesheet('tiles', 'assets/isometric-grass-and-water.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('cow', 'assets/skeleton8.png', { frameWidth: 128, frameHeight: 128 });
        this.load.image('house', 'assets/rem_0002.png');
    }

    create ()
    {
        scene = this;

        this.buildMap();
        this.placeHouses();

        const tilemap = this.add.tilemap("map");
        const navMesh = this.navMeshPlugin.buildMeshFromTilemap("tileMesh", tilemap);
        cow = this.add.existing(new Cow(this, 1450, 320, 'idle', { offset: 0, x: -2, y: 1}, navMesh));

        this.cameras.main.setBounds(0, 0, 1920 * 2, 1080 * 2);
        this.physics.world.setBounds(0, 0, 1920 * 2, 1080 * 2);
        
        this.cameras.main.startFollow(cow);

        this.input.on('pointerdown', function (pointer) {
            
            const end = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);

            // Tell the follower sprite to find its path to the target
            console.log(end);
            cow.goTo(end);
    
            // cow.walk({ offset: 0, x: -2, y: 1, startX: pointer.x, startY: pointer.y});
    
        }, this);
    }

    update (time, deltaTime)
    {
        cow.update(time, deltaTime);
    }


    buildMap ()
    {
        //  Parse the data out of the map
        const data = scene.cache.json.get('map');

        const tilewidth = data.tilewidth;
        const tileheight = data.tileheight;

        tileWidthHalf = tilewidth / 2;
        tileHeightHalf = tileheight / 2;

        const layer = data.layers[0].data;

        const mapwidth = data.layers[0].width;
        const mapheight = data.layers[0].height;

        const centerX = mapwidth * tileWidthHalf;
        const centerY = 16;

        let i = 0;

        for (let y = 0; y < mapheight; y++)
        {
            for (let x = 0; x < mapwidth; x++)
            {
                const id = layer[i] - 1;

                const tx = (x - y) * tileWidthHalf;
                const ty = (x + y) * tileHeightHalf;

                const tile = scene.add.image(centerX + tx, centerY + ty, 'tiles', id);

                tile.depth = centerY + ty;

                i++;
            }
        }
    }

    placeHouses ()
    {
        const house_1 = scene.add.image(530, 370, 'house');
        house_1.depth = house_1.y + 86;
    }
}

const config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    backgroundColor: '#ababab',
    scene: [ CowLandScene ],
    physics: {
        default: "arcade",
        arcade: {
          gravity: 0,
        },
    },
    plugins: {
        scene: [
          { key: "NavMeshPlugin", plugin: PhaserNavMeshPlugin, mapping: "navMeshPlugin", start: true }
        ]
    }
};

var game = new Phaser.Game(config);
