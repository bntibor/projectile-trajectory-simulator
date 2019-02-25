interface Point {
    x: number,
    y: number
}

class ProjectileMotionSimulation {

    private gravitationalAcceleration = 9.80665;

    private speed: number;
    private angle: number;

    private height: number;
    private width: number;

    private canonLength: number;
    private canonPivotPoint: Point;
    private canonFirePoint: Point;

    private ctx: CanvasRenderingContext2D;

    private range: number;

    private flatRange: number;

    private flightTime: number;

    constructor(speed: number, angle: number, canvas: HTMLCanvasElement, canonLength?: number) {
        this.speed = speed;
        this.angle = angle;

        this.height = canvas.height;
        this.width = canvas.width;

        this.canonLength = canonLength || 100;

        this.ctx = canvas.getContext('2d');

        this.computeCanonProperties();

        this.computeRange();
        this.computeFlightTime();
        this.computeFlatRange();
    }

    clearScene() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    playAnimation() {
        const horizontalSpeed = this.speed * Math.cos(this.toRadians(this.angle));
        let timeStamp = null;
        let thiz = this;
        let trail: Point[] = [];
        let trailCounter = 0;

        this.drawCannon();

        function step(curentTime) {
            if (timeStamp) {

                let x = (curentTime / 1000 - timeStamp / 1000) * horizontalSpeed;
                let y = thiz.canonFirePoint.y + thiz.f(x);

                x = x + thiz.canonFirePoint.x;

                thiz.clearScene();
                thiz.drawCannon();

                thiz.ctx.fillStyle = 'red';

                drawTrail();

                thiz.ctx.globalAlpha = 1;
                thiz.ctx.beginPath();
                thiz.ctx.arc(x, thiz.height - y, thiz.canonLength / 10, 0, 2 * Math.PI);
                thiz.ctx.fill();

                addPointToTrail({ x: x, y: y });

                if (y > 0) {
                    window.requestAnimationFrame(step);
                } else {
                    thiz.drawRange();
                    thiz.drawFlatRangeData();
                }
            } else {
                window.requestAnimationFrame(step);
                timeStamp = curentTime;
            }
        }

        function addPointToTrail(point: Point) {
            trailCounter++;

            if (trailCounter % 60 == 0) {
                trail.push(point);
            }
        }

        function drawTrail() {

            thiz.ctx.globalAlpha = 0.5;

            for (let point of trail) {
                thiz.ctx.beginPath();
                thiz.ctx.arc(point.x, thiz.height - point.y, thiz.canonLength / 10, 0, 2 * Math.PI);
                thiz.ctx.fill();
            }
        }

        window.requestAnimationFrame(step);

    }

    computeRange() {
        const radians = this.toRadians(this.angle);
        this.range = ((this.speed * Math.cos(radians)) / this.gravitationalAcceleration) *
            ((this.speed * Math.sin(radians)) + Math.sqrt(Math.pow(this.speed * Math.sin(radians), 2) +
                (2 * this.gravitationalAcceleration * this.canonFirePoint.y)));
    }

    computeFlatRange() {
        this.flatRange = (Math.pow(this.speed, 2) * Math.sin(2 * this.toRadians(this.angle))) / this.gravitationalAcceleration;
    }

    drawRange() {
        const rangeMarking = this.range + this.canonFirePoint.x;
        const textStart = rangeMarking + 250 < this.width ? rangeMarking + 20 : rangeMarking - 240;

        this.ctx.beginPath();
        this.ctx.moveTo(rangeMarking, this.height - 150);
        this.ctx.lineTo(rangeMarking, this.height);
        this.ctx.stroke();

        this.ctx.font = "18px Arial";
        this.ctx.fillStyle = "black";
        this.ctx.fillText("Distance traveled is " + this.range.toFixed(2) + "m", textStart, this.height - 150);
    }

    drawFlatRangeData() {
        const rangeMarking = this.flatRange + this.canonFirePoint.x;
        const textStart = rangeMarking + 250 < this.width ? rangeMarking + 20 : rangeMarking - 240;

        this.ctx.strokeStyle = 'grey';
        this.ctx.beginPath();
        this.ctx.setLineDash([5, 15]);
        this.ctx.moveTo(this.canonFirePoint.x, this.height - this.canonFirePoint.y);
        this.ctx.lineTo(this.width, this.height - this.canonFirePoint.y);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.setLineDash([]);
        this.ctx.moveTo(this.canonFirePoint.x + this.flatRange, this.height - this.canonFirePoint.y);
        this.ctx.lineTo(this.canonFirePoint.x + this.flatRange, this.height - this.canonFirePoint.y - 150);
        this.ctx.stroke();

        this.ctx.font = "18px Arial";
        this.ctx.fillStyle = "grey";
        this.ctx.fillText("Flat distance traveled is " + this.flatRange.toFixed(2), textStart, this.height - this.canonFirePoint.y - 150);

        this.ctx.fillStyle = "red";
        this.ctx.beginPath();
        this.ctx.arc(this.canonFirePoint.x + this.flatRange, this.height - this.canonFirePoint.y, this.canonLength / 10, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    computeFlightTime() {
        this.flightTime = (2 * this.speed * Math.sin(this.toRadians(this.angle))) / this.gravitationalAcceleration;
    }

    f(x: number) {
        return (x * Math.tan(this.toRadians(this.angle))) - (this.gravitationalAcceleration / 2) * Math.pow(x / (this.speed * Math.cos(this.toRadians(this.angle))), 2);
    }

    private toRadians(angle: number) {
        return angle * (Math.PI / 180);
    }

    //Canon
    computeCanonProperties() {
        const x = this.canonLength / 5 + this.canonLength / 2;
        const y = this.canonLength / 2 - this.canonLength / 5;

        this.canonPivotPoint = { x: x, y: y };

        this.canonFirePoint = {
            x: x + this.canonLength * Math.cos(this.toRadians(this.angle)),
            y: y + this.canonLength * Math.sin(this.toRadians(this.angle))
        }
    }

    drawCannon() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.drawCannonPipe();
        this.drawBase();
    }

    drawBase() {
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath()
        this.ctx.arc(this.canonPivotPoint.x, this.height, this.canonLength / 2, Math.PI * 2, 0);
        this.ctx.fill();
    }

    drawCannonPipe() {
        let corners: Point[] = this.getInitialCorners();

        corners = corners.map((point) => this.rotatePoint.call(this, point));

        this.ctx.fillStyle = '#20a38d';
        this.ctx.beginPath();

        this.ctx.moveTo(corners[0].x, this.height - corners[0].y);
        for (let i = 1; i <= corners.length; i++) {
            this.ctx.lineTo(corners[i % corners.length].x, this.height - corners[i % corners.length].y);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    private getInitialCorners(): Point[] {
        const x1 = this.canonPivotPoint.x;
        const x2 = this.canonPivotPoint.x + this.canonLength;
        const y11 = this.canonPivotPoint.y - this.canonLength / 5;
        const y12 = this.canonPivotPoint.y + this.canonLength / 5;
        const y21 = this.canonPivotPoint.y + this.canonLength / 10;
        const y22 = this.canonPivotPoint.y - this.canonLength / 10;

        return [{ x: x1, y: y11 }, { x: x1, y: y12 }, { x: x2, y: y21 }, { x: x2, y: y22 }];
    }

    private rotatePoint(point: Point): Point {
        return {
            x: Math.cos(this.toRadians(this.angle)) * (point.x - this.canonPivotPoint.x) - Math.sin(this.toRadians(this.angle)) * (point.y - this.canonPivotPoint.y) + this.canonPivotPoint.x,
            y: Math.sin(this.toRadians(this.angle)) * (point.x - this.canonPivotPoint.x) + Math.cos(this.toRadians(this.angle)) * (point.y - this.canonPivotPoint.y) + this.canonPivotPoint.y
        }
    }
}

(function main() {
    function fire() {
        let speed = parseFloat((<HTMLInputElement>document.getElementById("speed")).value);
        let angle = parseFloat((<HTMLInputElement>document.getElementById("angle")).value);
        let size = parseFloat((<HTMLInputElement>document.getElementById("size")).value);
        let canvas = <HTMLCanvasElement>document.getElementById("mainCanvas");
        let trajectory = new ProjectileMotionSimulation(speed, angle, canvas, size);

        trajectory.playAnimation();
    }

    const drawButton = document.getElementById("fireButton");
    drawButton.onclick = fire;
}());