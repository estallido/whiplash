// whiplash.js
// Copyright (C) 2016 by Simon Gold and Jeff Gold.
//
// Whiplash Paradox is a game about time travel
(function(whiplash) {
    "use strict";

    var state = {
        height: 320, width: 320, zoom: 50,
        characters: []
    };
    whiplash.changeZoom = function(value) {
        state.zoom = value;
    };

    var drawBackground = function(ctx, state, now) {
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.arc(10, 0, 1, 0, 2 * Math.PI);
        ctx.fillStyle = 'green';
        ctx.fill();
    };

    var drawVision = function(ctx, character, state, now) {
        var size = character.size;
        ctx.save();
        ctx.translate(character.x, character.y);
        ctx.rotate(character.direction);

        if (character.visionRange && character.visionArc &&
            character.visionColor) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, size * character.visionRange,
                   -character.visionArc, character.visionArc);
            ctx.fillStyle = character.visionColor;
            ctx.fill();
        }
        ctx.restore();
    }

    var drawPerson = function(ctx, character, state, now) {
        var size = character.size;
        ctx.save();
        ctx.translate(character.x, character.y);
        ctx.rotate(character.direction);

        ctx.scale(0.8, 1);
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = character.bodyColor;
        ctx.fill();

        ctx.scale(1.25, 1);
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.arc(0, 0, size * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = character.headColor;
        ctx.fill();

        if (!character.blinkFreq || !character.blinkLength ||
            ((now + character.blinkPhase) % character.blinkFreq) >
            character.blinkLength) {
            ctx.beginPath();
            ctx.arc(size * 0.2, size * -0.2,
                    size * 0.1, 0, Math.PI * 2);
            ctx.fillStyle = character.eyeColor;
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(size, 0);
            ctx.arc(size * 0.2, size * 0.2,
                    size * 0.1, 0, Math.PI * 2);
            ctx.fillStyle = character.eyeColor;
            ctx.fill();
        }
        ctx.restore();
    }

    var makePlayer = function(x, y, size) {
        return {
            last: new Date().getTime(),
            x: x, y: y, direction: 0, size: size, speed: 0.009,
            aup: false, adown: false, aleft: false, aright: false,
            headColor: 'orangered',
            bodyColor: 'orange',
            eyeColor: 'blue',
            blinkFreq: 4000, blinkLength: 250, blinkPhase: 0,
            update: function(state, now) {
                var steps = this.speed * (now - this.last);
                var rots = 0.005 * (now - this.last);
                if (this.aleft && !this.aright) {
                    this.direction -= rots;
                } else if (!this.aleft && this.aright) {
                    this.direction += rots;
                }

                if (this.aup && !this.adown) {
                    this.x += Math.cos(this.direction) * steps;
                    this.y += Math.sin(this.direction) * steps;
                } else if (!this.aup && this.adown) {
                    this.x -= Math.cos(this.direction) * steps * 0.75;
                    this.y -= Math.sin(this.direction) * steps * 0.75;
                }
                this.last = now;
            },
            drawPre: function(ctx, state, now) {
                drawVision(ctx, this, state, now);
            },
            draw: function(ctx, state, now) {
                drawPerson(ctx, this, state, now);
            }
        };
    };

   var makeGuard = function(x, y, size) {
        return {
            last: new Date().getTime(),
            headColor: 'blue',
            bodyColor: 'darkgray',
            eyeColor: 'black',
            x: x, y: y, direction: 0, size: size, speed: 0.008,
            blinkFreq: 1000, blinkLength: 100,
            blinkPhase: Math.random() * 1000,
            visionRange: 5, visionArc: Math.PI / 10,
            visionColor: 'rgba(255, 255, 255, 0.25)',
            update: function(state, now) {
                var steps = this.speed * (now - this.last);
                var rots = 0.005 * (now - this.last);
                var vector = {
                    x: state.player.x - this.x,
                    y: state.player.y - this.y,
                };
                var length = Math.sqrt(
                    vector.x * vector.x + vector.y * vector.y);
                vector.x /= length;
                vector.y /= length;
                var dot = vector.x * Math.cos(this.direction) +
                          vector.y * Math.sin(this.direction);
                if (dot < Math.cos(Math.PI / 10)) {
                    if ((state.player.x - this.x) *
                        Math.sin(this.direction) -
                        (state.player.y - this.y) *
                        Math.cos(this.direction) < 0)
                        this.direction += rots;
                    else this.direction -= rots;
                } else if (length > this.size * this.visionRange) {
                    this.x += Math.cos(this.direction) * steps;
                    this.y += Math.sin(this.direction) * steps;
                }
                this.last = now;
            },
            drawPre: function(ctx, state, now) {
                drawVision(ctx, this, state, now);
            },
            draw: function(ctx, state, now) {
                drawPerson(ctx, this, state, now);
            }
        };
    };

    whiplash.go = function($, container, viewport) {
        var board = $('<canvas>').attr({
            'class': 'board'
        }).css({
            width: 320, height: 320, margin: 'auto',
            display: 'block',
            color: '#222', background: '#ddd'
        }).appendTo(container);

        var draw_id = 0, draw_last = 0;
        var draw = function() {
            var ii, ctx, width, height, color, lineWidth;
            var now = new Date().getTime();
            draw_id = 0;

            if (now - draw_last < 1000)
	        state.characters.forEach(function(character) {
                    character.update(state, now);
                });
            draw_last = now;

            if (board.get(0).getContext) {
                width = board.width();
                height = board.height();
                lineWidth = (width > height) ?
                    (width / 50) : (height / 50);
                color = board.css('color');

                ctx = board[0].getContext('2d');
                ctx.save();
                ctx.lineWidth = lineWidth;
                ctx.clearRect(0, 0, width, height);

                ctx.scale(state.zoom, state.zoom)
                ctx.translate((width / (2 * state.zoom)) -
                              state.player.x,
                              (height / (2 * state.zoom)) -
                              state.player.y);

                drawBackground(ctx, state, now);

                state.characters.forEach(function(character) {
                    if (character.drawPre)
                        character.drawPre(ctx, state, now);
                });

                state.characters.forEach(function(character) {
                    if (character.draw)
                        character.draw(ctx, state, now);
                });

                state.characters.forEach(function(character) {
                    if (character.drawPost)
                        character.drawPost(ctx, state, now);
                });

                ctx.restore();
                redraw();
            }
        };

        var redraw = function()
        { if (!draw_id) draw_id = requestAnimationFrame(draw); };

        var resize = function(event) {
	    board.width(viewport.width());
	    board.height(viewport.height() * 0.85);
            state.width = board.innerWidth();
            state.height = board.innerHeight();

            // A canvas has a height and a width that are part of the
            // document object model but also separate height and
            // width attributes which determine how many pixels are
            // part of the canvas itself.  Keeping the two in sync
            // is essential to avoid ugly stretching effects.
            board.attr("width", board.innerWidth());
            board.attr("height", board.innerHeight());

            redraw();
        };

        board.on('click', function(event) {
            var row = Math.floor(event.offsetY * 3 / board.height());
            var col = Math.floor(event.offsetX * 3 / board.width());
        });

        board.resize(resize);
        resize();

        state.characters.push(makeGuard(-5, -5, 1));
        state.characters.push(makeGuard(5, -5, 1));
        state.characters.push(makeGuard(-5, 5, 1));
        state.characters.push(makeGuard(5, 5, 1));
	state.characters.push(state.player = makePlayer(0, 0, 1));

	viewport.on('keydown', function(event) {
	    if (event.keyCode == 37 || event.keyCode == 65) {
		state.player.aleft = true;
	    } else if (event.keyCode == 38 || event.keyCode == 87) {
                state.player.aup = true;
	    } else if (event.keyCode == 39 || event.keyCode == 68) {
		state.player.aright = true;
	    } else if (event.keyCode == 40 || event.keyCode == 83) {
		state.player.adown = true;
	    }
	});

	viewport.on('keyup', function(event) {
	    if (event.keyCode == 37 || event.keyCode == 65) {
		state.player.aleft = false;
	    } else if (event.keyCode == 38 || event.keyCode == 87) {
                state.player.aup = false;
	    } else if (event.keyCode == 39 || event.keyCode == 68) {
		state.player.aright = false;
	    } else if (event.keyCode == 40 || event.keyCode == 83) {
		state.player.adown = false;
	    }
	});

        var heartbeat = function() {
            //console.log("Thunk");
            setTimeout(heartbeat, 2000);
        };
        //heartbeat();

    }
})(typeof exports === 'undefined'? this['whiplash'] = {}: exports);
