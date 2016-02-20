// Enable whole-script strict mode syntax
'use strict';

// Sprite stores attributes for a sprite sheet such as Image
function Sprite() {
    this.image = null;
    this.numFrames = null;
    this.frameWidth = null;
}

// ResourceManager handles creation and storage of game resources
function ResourceManager() {
    // Module constants and variables
    const _this = this;
    _this.imageDict = {};
    _this.spriteDict = {};
    // Function that creates and returns a new Image
    function makeImage(source, width, height) {
        var image = new Image();
        image.src = source;
        image.width = width;
        image.height = height;
        return image;
    }
    // Function that creates and stores a new Image with a specific ID
    function addImage(id, source, width, height) {
        _this.imageDict[id] = makeImage(source, width, height);
    }
    // Function that creates and stores a new Sprite with a specific ID
    function addSprite(id, source, width, height, numFrames) {
        var sprite = new Sprite();
        sprite.image = makeImage(source, width, height);
        sprite.numFrames = numFrames;
        sprite.frameWidth = width / numFrames;
        _this.spriteDict[id] = sprite;
    }
    // Function that returns the Image corresponding to an ID
    function getImage(id) {
        return _this.imageDict[id];
    }
    // Function that returns the Sprite corresponding to an ID
    function getSprite(id) {
        return _this.spriteDict[id];
    }
    // Functions returned by the module
    return {
        addImage : addImage,
        getImage : getImage,
        addSprite : addSprite,
        getSprite : getSprite
    }
}

// BoundingBox provides an object an interface for collision detection
function BoundingBox(x, y, width, height) {
    // Module constants and variables
    const _this = this;
    _this.x = x;
    _this.y = y;
    _this.width = width;
    _this.height = height;
    // Function returns true if this BoundingBox overlaps other BoundingBox
    function isOverlap(other) {
        return (
            _this.x <= other.getX() &&
            _this.y <= other.getY() &&
            (_this.x + _this.width) >= (other.getX() + other.getWidth()) &&
            (_this.y + _this.height) >= (other.getY() + other.getHeight())
        );
    }
    // Function returns true if BoundingBox intersects with the mouse cursor
    function isOverlapMouse(mouseX, mouseY) {
        return (
            mouseX > _this.x && mouseX < (_this.x + _this.width) &&
            mouseY > _this.y && mouseY < (_this.y + _this.height)
        );
    }
    // Function that sets the value of the BoundingBox's x and y positions
    function update(x, y) {
        _this.x = x;
        _this.y = y;
    }
    // Function that returns the BoundingBox's x position
    function getX() {
        return _this.x;
    }
    // Function that returns the BoundingBox's y position
    function getY() {
        return _this.y;
    }
    // Function that returns the width of the BoundingBox
    function getWidth() {
        return _this.width;
    }
    // Function that returns the height of the BoundingBox
    function getHeight() {
        return _this.height;
    }
    // Functions returned by the module
    return {
        getX : getX,
        getY : getY,
        update : update,
        getWidth : getWidth,
        getHeight : getHeight,
        isOverlap : isOverlap,
        isOverlapMouse : isOverlapMouse
    }
}

// SpriteAnimation handles control and rendering of animations
function SpriteAnimation(sprite, initFrame, FPS, TPF) {
    // Module constants and variables
    const _this = this;
    _this.initFrame = initFrame;
    _this.FPS = FPS;
    _this.TPF = TPF;
    _this.image = sprite.image;
    _this.width = sprite.image.width;
    _this.fwidth = sprite.frameWidth;
    _this.height = sprite.image.height;
    _this.numFrames = sprite.numFrames;
    _this.opacity = 1;
    _this.frameIndex = initFrame; // Default is -1 for animations
    _this.tickCounter = 0;
    // Function that returns the opacity of the SpriteAnimation
    function getOpacity() {
        return _this.opacity;
    }
    // Function that reduces the opacity of the SpriteAnimation
    function reduceOpacity(secondsTillFade) {
        _this.opacity -= 1 / (_this.FPS * secondsTillFade);
        if (_this.opacity < 0) {
            _this.opacity = 0;
        }
    }
    // Function that updates the frame index of the SpriteAnimation
    function updateFrame() {
        _this.tickCounter += 1;
        // Update the frame index when the timer has triggered
        if (_this.tickCounter > _this.TPF) {
            _this.tickCounter = 0;
            // Update and reset the frame index at the end of the animation
            _this.frameIndex = ++_this.frameIndex % _this.numFrames;
        }
    }
    // Function that draws the SpriteAnimation
    function render(ctx, x, y, angle) {
        // Configure the translation points to center of image when rotating
        const translateX = x + (_this.width / (2 * _this.numFrames));
        const translateY = y + (_this.height / 2);
        ctx.save();
        // Configure the canvas opacity
        ctx.globalAlpha = _this.opacity;
        // Translate and rotate canvas to draw the animated Sprite at an angle
        ctx.translate(translateX, translateY);
        ctx.rotate(angle);
        ctx.translate(-translateX, -translateY);
        // Draw the animated Sprite
        ctx.drawImage(
            _this.image,
            _this.frameIndex * _this.fwidth,
            0,
            _this.fwidth,
            _this.height,
            x,
            y,
            _this.fwidth,
            _this.height
        );
        ctx.restore();
    }
    // Functions returned by the module
    return {
        render : render,
        getOpacity : getOpacity,
        updateFrame : updateFrame,
        reduceOpacity : reduceOpacity
    }
}

// GameSystem handles the core Game event management and rendering tasks
function GameSystem(FPS, canvasID) {
    // Module constants and variables
    const _this = this;
    _this.FPS = FPS;
    _this.canvasID = canvasID;
    _this.isGamePaused = false;
    _this.isGameActive = false;
    _this.boundGame = null;
    _this.resMan = new ResourceManager();
    // Function that initializes the GameSystem
    function init() {
        // Obtain the canvas and canvas context from the DOM
        const canvas = $(_this.canvasID).get(0);
        const ctx = canvas.getContext('2d');
        // Add event listener for mouse click events to the canvas
        canvas.addEventListener('mousedown', function() {
            mouseClickEvents(event, canvas);
        }, false);
        // Add event listener for mouse move events to the canvas
        canvas.addEventListener('mousemove', function() {
            mouseMoveEvents(event, canvas);
        }, false);
        // Initialize the bound game module
        _this.boundGame.init(
            _this.FPS, _this.resMan, ctx, canvas, _this.isGamePaused
        );
        // Execute the GameSystem event loop indefinitely
        setInterval(gameSystemLoop, 1000 / _this.FPS);
    }
    // Function that continuously updates and renders the GameSystem
    function gameSystemLoop() {
        if (_this.isGameActive && !_this.isGamePaused) {
            // Update the bound game module
            _this.boundGame.update();
            // Render the bound game module
            _this.boundGame.render();
        }
    }
    // Function that handles all of the mouse click events for GameSystem
    function mouseClickEvents(event, canvas) {
        // Process mouse click events if GameSystem is active and not paused
        if (_this.isGameActive && !_this.isGamePaused) {
            // Obtain the mouse coordinates relative to the canvas
            const mouseX = event.pageX - canvas.offsetLeft;
            const mouseY = event.pageY - canvas.offsetTop;
            // Trigger bound game module's mouse click event
            _this.boundGame.mouseClickEvent(mouseX, mouseY);
        }
    }
    // Function that handles all of the mouse move events for GameSystem
    function mouseMoveEvents(event, canvas) {
        // Process mouse move events if GameSystem is active and not paused
        if (_this.isGameActive && !_this.isGamePaused) {
            // Obtain the mouse coordinates relative to the canvas
            const mouseX = event.pageX - canvas.offsetLeft;
            const mouseY = event.pageY - canvas.offsetTop;
            // Trigger bound game module's mouse move event
            _this.boundGame.mouseMoveEvent(mouseX, mouseY);
        }
    }
    // Function that returns the GameSystem's ResourceManager
    function getResourceManager() {
        return _this.resMan;
    }
    // Function that toggles the GameSystem's state between paused or running
    function togglePause() {
        _this.isGamePaused = !_this.isGamePaused;
    }
    // Function that returns if the GameSystem is paused
    function isPaused() {
        return _this.isGamePaused;
    }
    // Function that returns if the GameSystem has started
    function isActive() {
        return _this.isGameActive;
    }
    // Function that officially starts the GameSystem
    function start() {
        // Reset the bound game module
        _this.boundGame.reset();
        _this.isGameActive = true;
    }
    // Function that officially stops the GameSystem
    function stop() {
        _this.isGameActive = false;
    }
    // Function that binds a game module to the GameSystem
    function bindGame(game) {
        _this.boundGame = game;
    }
    // Functions returned by the module
    return {
        init : init,
        stop : stop,
        start : start,
        bindGame : bindGame,
        isPaused : isPaused,
        isActive : isActive,
        togglePause : togglePause,
        getResourceManager : getResourceManager
    }
}

// Food handles event management and rendering tasks for Food
function Food(sprite, FPS, selectedFrame, x, y) {
    // Module constants and variables
    const _this = this;
    _this.animation = new SpriteAnimation(sprite, selectedFrame, FPS, 0);
    _this.bBox = new BoundingBox(x, y, sprite.frameWidth, sprite.image.height);
    _this.x = x;
    _this.y = y;
    _this.width = sprite.frameWidth;
    _this.height = sprite.image.height;
    _this.isEaten = false;
    _this.canDelete = false;
    // Function that handles updating the Food's state
    function update() {
        // If Food has been eaten then fade it out within half a second
        if (_this.isEaten) {
            _this.animation.reduceOpacity(0.5);
            // Set the Food delete flag to true once the Food has faded
            if (_this.animation.getOpacity() === 0) {
                _this.canDelete = true;
            }
        }
    }
    // Function that handles drawing the Object
    function render(ctx) {
        _this.animation.render(ctx, _this.x, _this.y, 0);
    }
    // Function that returns if the Food has been eaten
    function isEaten() {
        return _this.isEaten;
    }
    // Function that sets the state of the Food to eaten
    function setEaten() {
        _this.isEaten = true;
    }
    // Function that returns the Food's x position
    function getX() {
        return _this.x;
    }
    // Function that returns the Food's y position
    function getY() {
        return _this.y;
    }
    // Function that returns the Food's width
    function getWidth() {
        return _this.width;
    }
    // Function that returns the Food's height
    function getHeight() {
        return _this.height;
    }
    // Function that returns the Food's delete flag
    function canDelete() {
        return _this.canDelete;
    }
    // Function that returns the Food's bounding box
    function getBox() {
        return _this.bBox;
    }
    // Functions returned by the module
    return {
        getX : getX,
        getY : getY,
        getBox : getBox,
        update : update,
        render : render,
        isEaten : isEaten,
        getWidth : getWidth,
        setEaten : setEaten,
        getHeight : getHeight,
        canDelete : canDelete
    }
}

// Bug handles all event management and rendering tasks for Bug
function Bug(sprite, points, speed, FPS, x, y) {
    // Module constants and variables
    const _this = this;
    _this.animation = new SpriteAnimation(sprite, -1, FPS, 10 / speed);
    _this.bBox = new BoundingBox(x, y, sprite.frameWidth, sprite.image.height);
    _this.x = x;
    _this.y = y;
    _this.defaultX = x;
    _this.defaultY = y;
    _this.width = sprite.frameWidth;
    _this.height = sprite.image.height;
    _this.points = points;
    _this.speed = speed;
    _this.angle = 0;
    _this.moveToX = 0;
    _this.moveToY = 0;
    _this.isDead = false;
    _this.canDelete = false;
    // Function that handles updating the Bug's state
    function update(foodObjects) {
        // Update the Bug if it is alive
        if (!_this.isDead) {
            // Set the direction for the Bug to move in
            setMovement(foodObjects);
            // Handle collision with Food
            handleFoodCollision(foodObjects);
            // Update the Bug's animation
            _this.animation.updateFrame();
            // Update the bounding box
            _this.bBox.update(_this.x, _this.y);
        } else {
            // Fade the Bug within 2 seconds
            _this.animation.reduceOpacity(2);
            // Set the Bug delete flag to true once the Bug has faded
            if (_this.animation.getOpacity() === 0) {
                _this.canDelete = true;
            }
        }
    }
    // Function that handles drawing the Bug
    function render(ctx) {
        _this.animation.render(ctx, _this.x, _this.y, _this.angle);
    }
    // Function that moves the Bug's position to a specific target point
    function moveToPoint(x, y) {
        // Calculate the distance to the target point
        var distX = x - _this.x - (_this.width / 2);
        var distY = y - _this.y - (_this.height / 2);
        // Calculate the hypotenuse
        var hyp = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
        distX /= hyp;
        distY /= hyp;
        // Move towards point
        _this.x += distX * _this.speed;
        _this.y += distY * _this.speed;
        // Update the Bug's angle depending on the movement direction
        _this.angle = Math.atan2(distY, distX);
    }
    // Function that handles collision with Food and the current Bug
    function handleFoodCollision(foodObjects) {
        for (var i = 0; i < foodObjects.length; i++) {
            var food = foodObjects[i];
            // If Food has not been eaten
            if (!food.isEaten()) {
                // Check if the Bug is colliding with a Food object
                if (food.getBox().isOverlap(_this.bBox)) {
                    food.setEaten();
                }
            }
        }
    }
    // Function that sets the direction of movement for the Bug
    function setMovement(foodObjects) {
        var shortestDist = Number.MAX_VALUE;
        // If there is no avaliable Food to eat then move outside the table
        if (foodObjects.length == 1 && foodObjects[0].isEaten()) {
            _this.moveToX = _this.defaultX;
            _this.moveToY = _this.defaultY;
        } else {
            // Find the nearest Food from the Bug's current position
            for (var i = 0; i < foodObjects.length; i++) {
                var food = foodObjects[i];
                // If the Food has not been eaten
                if (!food.isEaten()) {
                    // Calculate the distance between the Bug and Food
                    var foodX = food.getX() + (food.getWidth() / 2);
                    var foodY = food.getY() + (food.getHeight() / 2);
                    var distX = foodX - _this.x;
                    var distY = foodY - _this.y;
                    // Calculate the hypotenuse to calculate shortest distance
                    var hyp = Math.sqrt(
                        Math.pow(distX, 2) + Math.pow(distY, 2)
                    );
                    // If hypotenuse is shorter than current shortest distance
                    if (hyp < shortestDist) {
                        // Set move to point to current Food's position
                        _this.moveToX = foodX;
                        _this.moveToY = foodY;
                        shortestDist = hyp;
                    }
                }
            }
        }
        // Move the Bug to a specific position
        moveToPoint(_this.moveToX, _this.moveToY);
    }
    // Function that returns the Bug's delete flag
    function canDelete() {
        return _this.canDelete;
    }
    // Function that sets the state of the Bug to dead
    function setDead() {
        _this.isDead = true;
    }
    // Function that returns if the Bug has been killed
    function isDead() {
        return _this.isDead;
    }
    // Return the number of points the Bug is worth
    function getPoints() {
        return _this.points;
    }
    // Function that returns the Bug's bounding box
    function getBox() {
        return _this.bBox;
    }
    return {
        getBox : getBox,
        update : update,
        render : render,
        isDead : isDead,
        setDead : setDead,
        getPoints : getPoints,
        canDelete : canDelete
    }
}

// TapTapBugGame handles event management and rendering tasks for TapTapBugGame
function TapTapBugGame() {
    // Module constants and variables
    const _this = this;
    _this.FPS = null;
    _this.resMan = null;
    _this.ctx = null;
    _this.canvas = null;
    _this.isGamePaused = null;
    _this.updateScoreTextFunc = null;
    _this.updateTimeTextFunc = null;
    _this.gameOverEventFunc = null;
    _this.sprFoodID = null;
    _this.imgBackgroundID = null;
    _this.bgPattern = null;
    _this.bugDB = {};
    _this.bugProbs = [];
    _this.bugMakeTimes = [];
    _this.bugObjects = [];
    _this.foodObjects = [];
    _this.bugMakeTime = 0;
    _this.mouseX = 0;
    _this.mouseY = 0;
    _this.score = 0;
    _this.ticks = 0;
    _this.lowX = 0;
    _this.highX = 0;
    _this.lowY = 0;
    _this.highY = 0;
    _this.tolX = 0;
    _this.tolY = 0;
    _this.foodAmount = 0;
    _this.timeAlloted = 0;
    _this.defaultTimeAlloted = 0;
    _this.isGameOver = false;
    // Function that initializes TapTapBugGame
    function init(FPS, resMan, ctx, canvas, isGamePaused) {
        // Set game variables
        _this.FPS = FPS;
        _this.resMan = resMan;
        _this.ctx = ctx;
        _this.canvas = canvas;
        _this.isGamePaused = isGamePaused;
        // Set the game's background
        setBackground();
        // Reset the Bug make timer and init Bug make probability distribution
        setMakeBugProbability();
        // Reset game variables
        reset();
    }
    // Function that resets the game variables to their default values
    function reset() {
        // Set default initialized values
        _this.timeAlloted = _this.defaultTimeAlloted;
        // Set default instance values
        _this.score = 0;
        _this.ticks = 0;
        _this.bugMakeTime = 0;
        _this.bugObjects = [];
        _this.foodObjects = [];
        _this.isGameOver = false;
        _this.updateScoreTextFunc(0);
        // Create the required Food for the Game
        makeFood();
    }
    // Function that handles updating attributes for TapTapBugGame
    function update() {
        // If game is not over
        if (!_this.isGameOver) {
            // Update the time alloted and it's corresponding time display text
            _this.timeAlloted -= 1 / _this.FPS;
            _this.updateTimeTextFunc(Math.floor(_this.timeAlloted));
            // Create new Bugs
            makeBugs();
        }
        // Handle game over for TapTapBugGame
        handleGaveOver();
        // Update the canvas cursor when hovering over a Bug
        updateBugHoverCanvasCursor();
        // Update all of the Food
        for (var i in _this.foodObjects) {
            // Obtain Food from foodObjects array and update it
            var food = _this.foodObjects[i];
            food.update();
            // Delete Food if it is flagged for removal
            if (food.canDelete()) {
                _this.foodObjects.splice(_this.foodObjects.indexOf(food), 1);
            }
        }
        // Update all of the Bugs
        for (var i in _this.bugObjects) {
            // Obtain Bug from bugObjects array and update it
            var bug = _this.bugObjects[i];
            bug.update(_this.foodObjects);
            // If the game is over then kill this Bug
            if (_this.isGameOver) {
                bug.setDead();
            }
            // Delete Bug if it is flagged for removal
            if (bug.canDelete()) {
                _this.bugObjects.splice(_this.bugObjects.indexOf(bug), 1);
            }
        }
    }
    // Function that handles drawing tasks for TapTapBugGame
    function render() {
        // Render the Game's background
        _this.ctx.fillStyle = _this.bgPattern;
        _this.ctx.fillRect(0, 0, _this.canvas.width, _this.canvas.height);
        // Render all of the Food
        for (var i in _this.foodObjects) {
            _this.foodObjects[i].render(_this.ctx);
        }
        // Render all of the Bugs
        for (var i in _this.bugObjects) {
            _this.bugObjects[i].render(_this.ctx);
        }
    }
    // Function that handles all mouse click tasks for TapTapBugGame
    function mouseClickEvent(mouseX, mouseY) {
        // Handle mouse click on Bug objects
        for (var i in _this.bugObjects) {
            var bug = _this.bugObjects[i];
            // If mouse cursor is hovering over the Bug
            if (bug.getBox().isOverlapMouse(_this.mouseX, _this.mouseY)) {
                // Update score only once
                if (!bug.isDead()) {
                    // Update score and update corresponding DOM element
                    _this.score += bug.getPoints();
                    _this.updateScoreTextFunc(_this.score);
                }
                // Kill the Bug
                bug.setDead();
            }
        }
    }
    // Function that handles all mouse move tasks for TapTapBugGame
    function mouseMoveEvent(mouseX, mouseY) {
        // Record the mouse coordinates when the mouse has moved
        _this.mouseX = mouseX;
        _this.mouseY = mouseY;
    }
    // Function that updates the canvas cursor when hovering over a Bug
    function updateBugHoverCanvasCursor() {
        for (var i in _this.bugObjects) {
            var bug = _this.bugObjects[i];
            // If hovering over Bug change cursor to 'pointer' and break loop
            if (bug.getBox().isOverlapMouse(_this.mouseX, _this.mouseY)) {
                $('body').addClass('pointer-cursor');
                break;
            }
            // Change the cursor back to 'defualt' when not hovering
            $('body').removeClass('pointer-cursor');
        }
    }
    // Function that makes a specific amount of Food positioned randomly
    function makeFood() {
        var foodCount = 0;
        var usedFrames = [];
        var usedPos = [];
        // Obtain the Food's Sprite, frame width and height
        const foodSprite = _this.resMan.getSprite(_this.sprFoodID);
        const foodWidth = foodSprite.frameWidth;
        const foodHeight = foodSprite.image.height;
        const foodFrames = foodSprite.numFrames;
        // Generate Food with specific frame index within a specific range
        while (foodCount < _this.foodAmount) {
            // Generate random positions specified by the bound variables
            var x = getRandomNumber(_this.lowX, _this.highX);
            var y = getRandomNumber(_this.lowY, _this.highY);
            // Generate a random frame index for the Food's Sprite image
            var randFrame = getRandomNumber(0, foodFrames - 1);
            var isOverlap = false;
            // Ensure new position doesn't overlap with previous positions
            for (var i in usedPos) {
                if (
                    Math.abs(x - usedPos[i].x) <= (foodWidth + _this.tolX) &&
                    Math.abs(y - usedPos[i].y) <= (foodHeight + _this.tolY)
                ) {
                    isOverlap = true;
                    break;
                }
            }
            // Create Food if there is no overlap
            if (!isOverlap) {
                // Ensure that a new frame index is generated for each Food
                while(usedFrames.indexOf(randFrame) >= 0) {
                    // Use existing index if all frame indicies are used
                    if (usedFrames.length === foodSprite.numFrames) {
                        randFrame = getRandomItem(usedFrames);
                    } else {
                        randFrame = getRandomNumber(0, foodFrames - 1);
                    }
                }
                _this.foodObjects.push(
                    new Food(foodSprite, _this.FPS, randFrame, x, y)
                );
                usedPos.push({'x' : x, 'y' : y});
                // Add new frame index to used list if
                if (usedFrames.indexOf(randFrame) < 0) {
                    usedFrames.push(randFrame);
                }
                foodCount += 1;
            }
        }
    }
    // Function that handles creating a new Bug with random attributes
    function makeBugs() {
        _this.ticks += 1;
        // If Bug make timer has triggered
        if (_this.ticks > _this.bugMakeTime * _this.FPS) {
            // Reset the Bug make timer
            _this.ticks = 0;
            _this.bugMakeTime = getRandomItem(_this.bugMakeTimes);
            // Configure Bug using randomly generated attributes
            const bugSpriteID = getRandomItem(_this.bugProbs);
            const bugSprite = _this.resMan.getSprite(bugSpriteID);
            const bugPoints = _this.bugDB[bugSpriteID]['points'];
            const bugSpeed = _this.bugDB[bugSpriteID]['speed'];
            const bugWidth = bugSprite.frameWidth;
            const bugHeight = bugSprite.image.height;
            const y = getRandomItem(
                [0 - bugHeight, _this.canvas.height + bugHeight]
            );
            const x = getRandomNumber(
                bugHeight, _this.canvas.width - bugHeight
            );
            // Create a new Bug using the above attributes
            _this.bugObjects.push(
                new Bug(bugSprite, bugPoints, bugSpeed, _this.FPS, x, y)
            );
        }
    }
    // Function that handles the offical game over ends for TapTapBugGame
    function handleGaveOver() {
        // Game is over if the timer has expired or all Food is eaten
        if (_this.timeAlloted < 1 || _this.foodObjects.length < 1) {
            _this.isGameOver = true;
        }
        // If game is over and all Bugs are dead then officially end the game
        if (_this.isGameOver && _this.bugObjects.length < 1) {
            // If the alloted time reached 0 then user has won
            if (_this.timeAlloted < 1) {
                _this.gameOverEventFunc(_this.score, true);
            } else {
                _this.gameOverEventFunc(_this.score, false);
            }
        }
    }
    // Function that creates the probability distribution for making Bugs
    function setMakeBugProbability() {
        for (var key in _this.bugDB) {
            var factor = _this.bugDB[key]['weight'] * 10;
            // Append Bug ID equal to the weight of the Bug's probability
            _this.bugProbs = _this.bugProbs.concat(Array(factor).fill(key));
        }
    }
    // Function that sets the background for the game
    function setBackground() {
        // Obtain the background Image from the ResourceManager
        const image = _this.resMan.getImage(_this.imgBackgroundID);
        image.onload = function() {
            // Create a pattern using the background Image
            _this.bgPattern = _this.ctx.createPattern(image, 'repeat');
        }
    }
    // Function that adds information about a new Bug to the Bug database
    function addBug(spriteID, points, speed, weight) {
        _this.bugDB[spriteID] = {
            'points' : points, 'speed' : speed, 'weight' : weight
        };
    }
    // Function that sets the amount of time alloted for the game
    function setAllotedTime(timeAlloted) {
        _this.defaultTimeAlloted = timeAlloted + 1;
    }
    // Function that sets the make times array for the Bug
    function setBugMakeTimes(makeTimes) {
        _this.bugMakeTimes = makeTimes;
    }
    // Function that sets the range in which to make and position Food
    function setFoodMakeRange(lowX, highX, lowY, highY) {
        _this.lowX = lowX;
        _this.highX = highX;
        _this.lowY = lowY;
        _this.highY = highY;
    }
    // Function that sets the tolerance values for positioning Food apart
    function setFoodMakeTolerance(tolX, tolY) {
        _this.tolX = tolX;
        _this.tolY = tolY;
    }
    // Function that sets the amount of Food to make for the game
    function setFoodMakeAmount(foodAmount) {
        _this.foodAmount = foodAmount;
    }
    // Function that binds the update score text function to the game
    function bindUpdateScoreTextFunc(updateScoreTextFunc) {
        _this.updateScoreTextFunc = updateScoreTextFunc;
    }
    // Function that binds the update time text function to the game
    function bindUpdateTimeTextFunc(updateTimeTextFunc) {
        _this.updateTimeTextFunc = updateTimeTextFunc;
    }
    // Function that binds the game over event function to the game
    function bindGameOverEventFunc(gameOverEventFunc) {
        _this.gameOverEventFunc = gameOverEventFunc;
    }
    // Function that sets the Sprite ID for the Food
    function setSpriteFoodID(sprFoodID) {
        _this.sprFoodID = sprFoodID;
    }
    // Function that sets the background Image ID for the game
    function setImageBackgroundID(imgBackgroundID) {
        _this.imgBackgroundID = imgBackgroundID;
    }
    // Function that randomly returns an item from an array
    function getRandomItem(itemArray) {
        return itemArray[Math.floor(Math.random() * itemArray.length)];
    }
    // Function that returns a random number between an inclusive range
    function getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    // Functions returned by the module
    return {
        init : init,
        reset : reset,
        addBug : addBug,
        render : render,
        update : update,
        setAllotedTime : setAllotedTime,
        mouseMoveEvent : mouseMoveEvent,
        setBugMakeTimes : setBugMakeTimes,
        setSpriteFoodID : setSpriteFoodID,
        mouseClickEvent : mouseClickEvent,
        setFoodMakeRange : setFoodMakeRange,
        setFoodMakeAmount : setFoodMakeAmount,
        setFoodMakeTolerance : setFoodMakeTolerance,
        setImageBackgroundID : setImageBackgroundID,
        bindGameOverEventFunc : bindGameOverEventFunc,
        bindUpdateTimeTextFunc : bindUpdateTimeTextFunc,
        bindUpdateScoreTextFunc : bindUpdateScoreTextFunc
    }
}

// Setup handles the config of the game page and behaviour of DOM elements
function Setup() {
    // Module constants and variables
    const _this = this;
    _this.FPS = 60;
    _this.WIN_LS_HIGHSCORE = 'taptapbug_highscore';
    // DOM element IDs
    _this.ID_CANVAS = '#game-canvas';
    _this.ID_SCORE_LINK = '#score-link';
    _this.ID_HOME_LINK = '#home-link';
    _this.ID_BUTTON_CLEAR = '#clear-button';
    _this.ID_BUTTON_RETRY = '#retry-button';
    _this.ID_BUTTON_PLAY = '#play-button';
    _this.ID_BUTTON_PR = '#pause-resume-button';
    _this.ID_HEADING_SCORE = '#score-heading';
    _this.ID_SCORE_SECTION = '#score-section';
    _this.ID_HOME_SECTION = '#home-section';
    _this.ID_GAME_SECTION = '#game-section';
    _this.ID_SCORE_TEXT = '#score-text';
    _this.ID_TIME_TEXT = '#time-text';
    _this.ID_LOST_MSG = '#game-lose-message';
    _this.ID_WON_MSG = '#game-won-message';
    // Resource element IDs
    _this.IMG_BUTTON_PLAY = 'assets/button_play.png';
    _this.IMG_BUTTON_PAUSE = 'assets/button_pause.png';
    _this.IMG_BG = 'assets/background_table.png';
    _this.SPR_FOOD = 'assets/food_sprite.png';
    _this.SPR_RED_BUG = 'assets/red_bug_sprite.png';
    _this.SPR_ORAN_BUG = 'assets/orange_bug_sprite.png';
    _this.SPR_GREY_BUG = 'assets/grey_bug_sprite.png';
    // Instance variables
    _this.sys = null;
    _this.ttbGame = null;
    // Function that initializes tasks to setup the game page and DOM elements
    function init() {
        // Initialize main objects required for the game
        initGameObjects();
        // Initialize game resources
        initResources();
        // Bind unobtrusive event handlers
        bindEventHandlers();
        // Configure TapTapBugGame
        configGame();
        // Initialize GameSystem
        _this.sys.init();
    }
    // Function that binds event functions to specific links and buttons
    function bindEventHandlers() {
        $(_this.ID_SCORE_LINK).click(function() {
            navScoreEvent();
        });
        $(_this.ID_HOME_LINK).click(function() {
            navHomeEvent();
        })
        $(_this.ID_BUTTON_RETRY).click(function() {
            retryButtonEvent();
        });
        $(_this.ID_BUTTON_CLEAR).click(function() {
            clearScoreButtonEvent();
        });
        $(_this.ID_BUTTON_PLAY).click(function() {
            playGameButtonEvent();
        });
        $(_this.ID_BUTTON_PR).click(function() {
            pauseResumeButtonEvent();
        });
    }
    // Function that initializes all the main objects for the game
    function initGameObjects() {
        // Create new ResourceManager, GameSystem and TapTapBugGame objects
        _this.ttbGame = new TapTapBugGame();
        _this.sys = new GameSystem(_this.FPS, _this.ID_CANVAS);
    }
    // Function that adds all of the game resources using the ResourceManager
    function initResources() {
        _this.sys.getResourceManager().addImage(
            'IMG_BG', _this.IMG_BG, 387, 600
        );
        _this.sys.getResourceManager().addSprite(
            'SPR_FOOD', _this.SPR_FOOD, 896, 56, 16
        );
        _this.sys.getResourceManager().addSprite(
            'SPR_RED_BUG', _this.SPR_RED_BUG, 90, 50, 2
        );
        _this.sys.getResourceManager().addSprite(
            'SPR_ORAN_BUG', _this.SPR_ORAN_BUG, 90, 50, 2
        );
        _this.sys.getResourceManager().addSprite(
            'SPR_GREY_BUG', _this.SPR_GREY_BUG, 90, 50, 2
        );
    }
    // Function that configures the games attributes
    function configGame() {
        _this.ttbGame.setAllotedTime(60);
        _this.ttbGame.setFoodMakeAmount(6);
        _this.ttbGame.setFoodMakeTolerance(30, 30);
        _this.ttbGame.setBugMakeTimes([0.5, 0.9, 1.2]);
        _this.ttbGame.setFoodMakeRange(10, 300, 120, 380);
        _this.ttbGame.setSpriteFoodID('SPR_FOOD');
        _this.ttbGame.setImageBackgroundID('IMG_BG');
        _this.ttbGame.bindUpdateScoreTextFunc(updateScore);
        _this.ttbGame.bindUpdateTimeTextFunc(updateTime);
        _this.ttbGame.bindGameOverEventFunc(gameOverEvent);
        _this.ttbGame.addBug('SPR_RED_BUG', 3, 2.5, 0.3);
        _this.ttbGame.addBug('SPR_ORAN_BUG', 1, 1.5, 0.5);
        _this.ttbGame.addBug('SPR_GREY_BUG', 5, 4, 0.2);
        _this.sys.bindGame(_this.ttbGame);
    }
    // Function that updates the score text
    function updateScore(score) {
        $(_this.ID_SCORE_TEXT).text('Score: ' + score);
    }
    // Function that updates the time text
    function updateTime(time) {
        $(_this.ID_TIME_TEXT).text('Time: ' + time);
    }
    // Function that handles events for when TapTapBugGame is finished
    function gameOverEvent(score, isWin) {
        // Stop the GameSystem
        _this.sys.stop();
        // Navigate to score page
        navScoreEvent();
        // Hide the game page section and show the retry button
        $(_this.ID_GAME_SECTION).hide();
        $(_this.ID_BUTTON_RETRY).show();
        // If user has won display win message, otherwise display lose message
        if (isWin) {
            $(_this.ID_WON_MSG).show();
            // saves score to local storage if it's larger than previous score
            if (score > getScore()) {
                window.localStorage.setItem(_this.WIN_LS_HIGHSCORE, score);
                // Update high score heading
                $(_this.ID_HEADING_SCORE).text('New High Score: ' + score);
            }
        } else {
            $(_this.ID_LOST_MSG).show();
        }
    }
    // Function that handles the events for the score navigation link
    function navScoreEvent() {
        // Call events if game is not running
        if (!_this.sys.isActive()) {
            // Set score link item to active and home link item to inactive
            $(_this.ID_SCORE_LINK).addClass('active');
            $(_this.ID_HOME_LINK).removeClass('active');
            // Hide the home page section and show the score page section
            $(_this.ID_HOME_SECTION).hide();
            $(_this.ID_SCORE_SECTION).show();
            // Refresh displayed score
            refreshScore();
        }
    }
    // Function that handles the events for the home navigation link
    function navHomeEvent() {
        // Call events if game is not running
        if (!_this.sys.isActive()) {
            // Set home link item to active and score link item to inactive
            $(_this.ID_HOME_LINK).addClass('active');
            $(_this.ID_SCORE_LINK).removeClass('active');
            // Hide the score page section and show the home page section
            $(_this.ID_SCORE_SECTION).hide();
            $(_this.ID_HOME_SECTION).show();
            // Hide the win and lose messages and the retry button
            $(_this.ID_WON_MSG).hide();
            $(_this.ID_LOST_MSG).hide();
            $(_this.ID_BUTTON_RETRY).hide();
        }
    }
    // Function that handles the events for the retry button
    function retryButtonEvent() {
        navHomeEvent();
        playGameButtonEvent();
    }
    // Function that handles the events for the play game button
    function playGameButtonEvent() {
        // Hide the home page section and show the game page section
        $(_this.ID_HOME_SECTION).hide();
        $(_this.ID_GAME_SECTION).show();
        // Start the GameSystem
        _this.sys.start();
    }
    // Function that handles the events for the pause / resume button
    function pauseResumeButtonEvent() {
        // Pause the game if the game is running and resume if game is paused
        _this.sys.togglePause();
        // Change the image of the button depending on the state of the game
        if (_this.sys.isPaused()) {
            $(_this.ID_BUTTON_PR + ' img').attr('src', _this.IMG_BUTTON_PLAY);
        } else {
            $(_this.ID_BUTTON_PR + ' img').attr('src', _this.IMG_BUTTON_PAUSE);
        }
    }
    // Function that handles the events for the clear score button
    function clearScoreButtonEvent() {
        window.localStorage.removeItem(_this.WIN_LS_HIGHSCORE);
        // Refresh displayed score
        refreshScore();
    }
    // Function that updates the score heading with score from local storage
    function refreshScore() {
        // Obtain the highScore from local storage and use 0 as default value
        $(_this.ID_HEADING_SCORE).text('High Score: ' + getScore());
    }
    // Function that return the highscore entry from local storage
    function getScore() {
        // Obtain the score, use 0 if score does not exist
        var rawScore = window.localStorage.getItem(_this.WIN_LS_HIGHSCORE);
        return rawScore ? rawScore : 0;
    }
    // Functions returned by the module
    return {
        init : init
    }
}

// Setup the game page and DOM element events
window.onload = new Setup().init;
