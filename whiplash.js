// whiplash.js
// Copyright (C) 2016 by Simon Gold and Jeff Gold.
//
// The Island of whiplash is a game about a prison. The prisoners
// must escape prison, while guards and the warden must keep them
// in, and deal with the traitor.
(function(whiplash) {
    "use strict";

    var makePlayer = function(x, y, size) {
        return {
            last: new Date().getTime(),
            aup: false, adown: false, aleft: false, aright: false,
            x: x, y: y, direction: 0,
            update: function(state, now) {
                var steps = 0.25 * (now - this.last);
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
            draw: function(state, ctx) {
                var scale = state.width / 35;
                ctx.save();

                ctx.beginPath();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.direction);
                ctx.scale(0.8, 1);
                ctx.moveTo(scale, 0);
                ctx.arc(0, 0, scale, 0, Math.PI * 2);
                ctx.fillStyle = 'orange';
                ctx.fill();

                ctx.scale(1.25, 1);
                ctx.beginPath();
                ctx.moveTo(scale, 0);
                ctx.arc(0, 0, scale * 0.75, 0, Math.PI * 2);
                ctx.fillStyle = 'orangered';
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(scale, 0);
                ctx.arc(scale * 0.2, scale * -0.2, scale * 0.1,
                        0, Math.PI * 2);
                ctx.fillStyle = 'black';
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(scale, 0);
                ctx.arc(scale * 0.2, scale * 0.2,
                        scale * 0.1, 0, Math.PI * 2);
                ctx.fillStyle = 'black';
                ctx.fill();

                ctx.restore();
            }
        };
    };

    var makeGuard = function(x, y, size) {
	var speed = 0;
        return {
            last: new Date().getTime(),
            x: x, y: y, dx: (Math.random() > 0.5) ? speed : -speed,
            dy: 0,
            update: function(state, now) {
                this.x += this.dx * (now - this.last);
                if (this.x < 0) {
                    this.x = 0;
                    this.dx = -this.dx;
                } else if (this.x > state.width) {
                    this.x -= this.x - state.width;
                    this.dx = -this.dx;
                }
                this.y += this.dy * (now - this.last);
                if (this.y < 0) {
                    this.y = 0;
                    this.dy = -this.dy;
                } else if (this.y > state.height) {
                    this.y = state.height;
                    this.dy = -this.dy;
                }
                this.last = now;
            },
            draw: function(state, ctx) {
                var scale = state.width / 35;
                ctx.save();

                ctx.beginPath();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.direction);
                ctx.scale(0.8, 1);
                ctx.moveTo(scale, 0);
                ctx.arc(0, 0, scale, 0, Math.PI * 2);
                ctx.fillStyle = 'darkgray';
                ctx.fill();

                ctx.scale(1.25, 1);
                ctx.beginPath();
                ctx.moveTo(scale, 0);
                ctx.arc(0, 0, scale * 0.75, 0, Math.PI * 2);
                ctx.fillStyle = 'blue';
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(scale, 0);
                ctx.arc(scale * 0.2, scale * -0.2, scale * 0.1,
                        0, Math.PI * 2);
                ctx.fillStyle = 'black';
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(scale, 0);
                ctx.arc(scale * 0.2, scale * 0.2,
                        scale * 0.1, 0, Math.PI * 2);
                ctx.fillStyle = 'black';
                ctx.fill();

                ctx.restore();
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
        var state = {
           height: 320, width: 320,
           characters: []
        };

        var draw_id = 0;
        var draw = function() {
            var ii, ctx, width, height, color, lineWidth;
            var now = new Date().getTime();
            draw_id = 0;

	        state.characters.forEach(function(character) {
                character.update(state, now);
            });

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

                state.characters.forEach(function(character) {
                    character.draw(state, ctx);
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

	var player = makePlayer(state.width / 2, state.height / 2, 30);
        state.characters.push(makeGuard(25, 25, 30));
        state.characters.push(makeGuard(225, 225, 30));
	state.characters.push(player);

	viewport.on('keydown', function(event) {
	    if (event.keyCode == 37 || event.keyCode == 65) {
		player.aleft = true;
	    } else if (event.keyCode == 38 || event.keyCode == 87) {
                player.aup = true;
	    } else if (event.keyCode == 39 || event.keyCode == 68) {
		player.aright = true;
	    } else if (event.keyCode == 40 || event.keyCode == 83) {
		player.adown = true;
	    }
	});
	viewport.on('keyup', function(event) {
	    if (event.keyCode == 37 || event.keyCode == 65) {
		player.aleft = false;
	    } else if (event.keyCode == 38 || event.keyCode == 87) {
                player.aup = false;
	    } else if (event.keyCode == 39 || event.keyCode == 68) {
		player.aright = false;
	    } else if (event.keyCode == 40 || event.keyCode == 83) {
		player.adown = false;
	    }
	});


        var heartbeat = function() {
            console.log("Thunk");
            setTimeout(heartbeat, 2000);
        };
        heartbeat();

    }
})(typeof exports === 'undefined'? this['whiplash'] = {}: exports);
