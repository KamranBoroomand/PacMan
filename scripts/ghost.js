class Ghost {
    constructor(
        x,
        y,
        width,
        height,
        speed,
        range,
        options = {}
    ) {
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.width = width;
        this.height = height;
        this.baseSpeed = speed;
        this.frightenedSpeed = oneBlockSize / 16 / .8 * .5;
        this.eatenSpeed = Math.max(oneBlockSize / 4, speed * 1.35);
        this.speed = speed;
        this.direction = DIRECTION_LEFT;
        this.range = range;
        this.state = "normal";
        this.houseDots = 0;
        this.suppressFrightened = false;
        this.personality = options.personality || "blinky";
        this.displayName = options.displayName || this.personality;
        this.scatterTile = options.scatterTile || { x: 1, y: 1 };
        this.houseState = {
            inside: Boolean(options.startInHouse),
            releaseDotThreshold: Number.isFinite(options.releaseDotThreshold)
                ? options.releaseDotThreshold
                : 0,
            forceReleaseMs: Number.isFinite(options.forceReleaseMs)
                ? options.forceReleaseMs
                : 0,
        };

        this.target = randomTargetsForGhosts[0];
        this.debugIntent = null;
        this.plannedDirection = null;
        this.pendingReverse = false;
    }

    dispose() {
        if (this.directionTimer) {
            clearInterval(this.directionTimer);
            this.directionTimer = null;
        }
    }

    setLevelSpeed(baseSpeed) {
        this.baseSpeed = baseSpeed;
        this.frightenedSpeed = oneBlockSize / 16 / .8 * .5;
        this.eatenSpeed = Math.max(oneBlockSize / 4, this.baseSpeed * 1.35);
        this.syncSpeedWithState();
    }

    isInHouse() {
        return this.houseState.inside;
    }

    setInHouse(inside) {
        this.houseState.inside = Boolean(inside);
    }

    isFrightened() {
        return this.state === "frightened";
    }

    isEaten() {
        return this.state === "eaten";
    }

    setState(nextState) {
        if (this.state === nextState) return;
        this.state = nextState;
        this.syncSpeedWithState();
    }

    syncSpeedWithState() {
        if (this.state === "eaten") {
            this.speed = this.eatenSpeed;
            return;
        }

        if (this.state === "frightened") {
            this.speed = this.frightenedSpeed;
            return;
        }

        this.speed = this.baseSpeed;
    }

    reverseDirection() {
        if (this.direction === DIRECTION_RIGHT) {
            this.direction = DIRECTION_LEFT;
        } else if (this.direction === DIRECTION_LEFT) {
            this.direction = DIRECTION_RIGHT;
        } else if (this.direction === DIRECTION_UP) {
            this.direction = DIRECTION_BOTTOM;
        } else {
            this.direction = DIRECTION_UP;
        }
    }

    setFrightenedMode(enabled) {
        if (this.isEaten()) return;
        const nextState = enabled ? "frightened" : "normal";
        if (enabled && this.state !== nextState) this.pendingReverse = true;
        this.setState(nextState);
    }

    setEatenMode() {
        this.setState("eaten");
    }

    releaseFromHouse() {
        this.houseState.inside = true;
        this.houseState.exiting = true;
        this.plannedDirection = null;
        lastPelletAt = lastUpdateNow;
    }

    maybeReleaseFromHouse() {
        if (!this.isInHouse() || this.houseState.exiting) return;
        if (typeof canReleaseGhostFromHouse !== "function") return;
        const shouldRelease = canReleaseGhostFromHouse(this);
        if (shouldRelease) {
            this.releaseFromHouse();
        }
    }

    updateModeFromGlobalState() {
        if (this.isEaten()) return;
        const frightenedActive =
            typeof isGhostFrightened === "function" && isGhostFrightened();
        this.setFrightenedMode(frightenedActive && !this.suppressFrightened);
    }

    getHomeTarget() {
        if (typeof getGhostHomeTarget === "function") {
            return getGhostHomeTarget();
        }
        return randomTargetsForGhosts[0];
    }

    getPersonalityTarget() {
        if (typeof getGhostTargetForPersonality === "function") {
            const target = getGhostTargetForPersonality(this);
            if (target) return target;
        }
        return { x: pacman.x, y: pacman.y };
    }

    hasReachedTargetTile(target) {
        if (!target) return false;
        const targetTileX = parseInt(target.x / oneBlockSize, 10);
        const targetTileY = parseInt(target.y / oneBlockSize, 10);
        return this.getMapX() === targetTileX && this.getMapY() === targetTileY;
    }

    moveProcess() {
        this.maybeReleaseFromHouse();
        if (this.isInHouse() && !this.houseState.exiting) {
            this.debugIntent = null;
            return;
        }

        this.updateModeFromGlobalState();

        if (this.houseState.exiting) {
            this.target = getGhostHouseExitTarget();
        } else if (this.isEaten()) {
            this.target = this.getHomeTarget();
        } else if (this.isFrightened()) {
            this.target = { x: this.x, y: this.y };
        } else {
            this.target = this.getPersonalityTarget();
        }

        this.changeDirectionIfPossible();
        this.moveForwards();
        this.handleTunnelWrap();

        if (this.checkCollisions()) {
            this.moveBackwards();
            return;
        }

        if (this.houseState.exiting && this.hasReachedTargetTile(getGhostHouseExitTarget()) &&
            this.x % oneBlockSize === 0 && this.y % oneBlockSize === 0) {
            this.houseState.exiting = false;
            this.setInHouse(false);
            this.direction = DIRECTION_LEFT;
            this.plannedDirection = null;
        }
        if (this.isEaten() && this.hasReachedTargetTile(this.getHomeTarget()) &&
            this.x % oneBlockSize === 0 && this.y % oneBlockSize === 0) {
            this.setState("normal");
            this.suppressFrightened = true;
            if (this.personality === "blinky") this.releaseFromHouse();
            else this.setInHouse(true);
        }
    }

    handleTunnelWrap() {
        const centerY = Math.floor((this.y + this.height / 2) / oneBlockSize);
        const lastColumn = map[0].length - 1;
        const maxX = (lastColumn + 1) * oneBlockSize;

        if (centerY < 0 || centerY >= map.length) return;

        const isTunnelRow =
            map[centerY][0] !== 1 && map[centerY][lastColumn] !== 1;
        if (!isTunnelRow) return;

        if (this.x + this.width <= 0) {
            this.x = lastColumn * oneBlockSize;
        } else if (this.x >= maxX) {
            this.x = 0;
        }
    }

    moveBackwards() {
        const vector = this.getDirectionVector(this.direction);
        this.x -= vector.x * (this.lastMoveDistance || this.speed);
        this.y -= vector.y * (this.lastMoveDistance || this.speed);
    }

    moveForwards() {
        const vector = this.getDirectionVector(this.direction);
        const coordinate = vector.x ? this.x : this.y;
        const sign = vector.x || vector.y;
        const remainder = ((coordinate % oneBlockSize) + oneBlockSize) % oneBlockSize;
        const boundary = remainder < 0.00001 ? oneBlockSize : sign > 0 ? oneBlockSize - remainder : remainder;
        this.lastMoveDistance = Math.min(this.speed, boundary);
        this.x += vector.x * this.lastMoveDistance;
        this.y += vector.y * this.lastMoveDistance;
        this.x = Math.round(this.x * 1000000) / 1000000;
        this.y = Math.round(this.y * 1000000) / 1000000;
    }

    checkCollisions() {
        const utils =
            typeof GameplayUtils === "object" && GameplayUtils
                ? GameplayUtils
                : null;

        if (utils && typeof utils.checkRectTileCollision === "function") {
            return utils.checkRectTileCollision(
                map,
                this.x,
                this.y,
                this.width,
                this.height,
                oneBlockSize,
                { allowHorizontalTunnelWrap: true, allowHouseGate: this.isEaten() || this.isInHouse() }
            );
        }

        const top = Math.floor(this.y / oneBlockSize);
        const left = Math.floor(this.x / oneBlockSize);
        const bottom = Math.floor((this.y + this.height - 1) / oneBlockSize);
        const right = Math.floor((this.x + this.width - 1) / oneBlockSize);
        const tileRows = map.length;
        const tileCols = map[0].length;

        if (top < 0 || bottom >= tileRows) {
            return true;
        }

        const outOfHorizontalBounds = left < 0 || right >= tileCols;
        if (outOfHorizontalBounds) {
            const centerY = Math.floor((this.y + this.height / 2) / oneBlockSize);
            const isTunnelRow =
                centerY >= 0 &&
                centerY < tileRows &&
                map[centerY][0] !== 1 &&
                map[centerY][tileCols - 1] !== 1;
            if (!isTunnelRow) {
                return true;
            }
        }

        const corners = [
            { x: left, y: top },
            { x: left, y: bottom },
            { x: right, y: top },
            { x: right, y: bottom },
        ];

        for (let i = 0; i < corners.length; i++) {
            const corner = corners[i];
            if (corner.x < 0 || corner.x >= tileCols) {
                continue;
            }
            if (map[corner.y][corner.x] === 1) {
                return true;
            }
        }

        return false;
    }

    changeDirectionIfPossible() {
        const epsilon = 0.00001;
        const aligned = Math.abs(this.x / oneBlockSize - Math.round(this.x / oneBlockSize)) < epsilon &&
            Math.abs(this.y / oneBlockSize - Math.round(this.y / oneBlockSize)) < epsilon;
        if (!aligned) return;
        const tile = { x: Math.round(this.x / oneBlockSize), y: Math.round(this.y / oneBlockSize) };
        const available = this.getAvailableDirections(tile.x, tile.y, map);
        if (this.pendingReverse && !this.isEaten() && !this.houseState.exiting) {
            this.reverseDirection();
            this.pendingReverse = false;
            this.plannedDirection = null;
        } else if (this.plannedDirection !== null && available.includes(this.plannedDirection)) {
            this.direction = this.plannedDirection;
        } else {
            this.direction = this.calculateNewDirection(map, this.target.x / oneBlockSize, this.target.y / oneBlockSize, tile);
        }
        const ahead = this.getNeighborTile(tile.x, tile.y, this.direction, map);
        if (ahead && this.isWalkableTile(ahead.x, ahead.y, map)) {
            this.plannedDirection = this.calculateNewDirection(map, this.target.x / oneBlockSize, this.target.y / oneBlockSize, ahead);
        } else this.plannedDirection = null;
    }

    snapCoordinateToGrid(value) {
        const nearestGridLine = Math.round(value / oneBlockSize) * oneBlockSize;
        const distance = Math.abs(nearestGridLine - value);
        const maxSnapDistance = Math.max(this.speed * 1.25, 1);

        if (distance > maxSnapDistance) {
            return null;
        }

        return nearestGridLine;
    }

    getOppositeDirection(direction) {
        if (direction === DIRECTION_RIGHT) return DIRECTION_LEFT;
        if (direction === DIRECTION_LEFT) return DIRECTION_RIGHT;
        if (direction === DIRECTION_UP) return DIRECTION_BOTTOM;
        return DIRECTION_UP;
    }

    getDirectionVector(direction) {
        if (direction === DIRECTION_RIGHT) return { x: 1, y: 0 };
        if (direction === DIRECTION_LEFT) return { x: -1, y: 0 };
        if (direction === DIRECTION_UP) return { x: 0, y: -1 };
        return { x: 0, y: 1 };
    }

    getDirectionPriority(direction) {
        return [DIRECTION_UP, DIRECTION_LEFT, DIRECTION_BOTTOM, DIRECTION_RIGHT].indexOf(direction);
    }

    getCurrentCenterTile() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        return {
            x: Math.floor(centerX / oneBlockSize),
            y: Math.floor(centerY / oneBlockSize),
        };
    }

    normalizeHorizontalTunnelTile(tileX, tileY, currentMap) {
        const numColumns = currentMap[0].length;
        if (tileX >= 0 && tileX < numColumns) {
            return tileX;
        }

        if (tileY < 0 || tileY >= currentMap.length) {
            return tileX;
        }

        const isTunnelRow =
            currentMap[tileY][0] !== 1 && currentMap[tileY][numColumns - 1] !== 1;
        if (!isTunnelRow) {
            return tileX;
        }

        return tileX < 0 ? numColumns - 1 : 0;
    }

    getNeighborTile(tileX, tileY, direction, currentMap) {
        const vector = this.getDirectionVector(direction);
        let nextX = tileX + vector.x;
        let nextY = tileY + vector.y;

        if (vector.y === 0) {
            nextX = this.normalizeHorizontalTunnelTile(nextX, tileY, currentMap);
        }

        if (nextY < 0 || nextY >= currentMap.length) {
            return null;
        }

        if (nextX < 0 || nextX >= currentMap[0].length) {
            return null;
        }

        return { x: nextX, y: nextY };
    }

    isWalkableTile(tileX, tileY, currentMap) {
        if (tileY < 0 || tileY >= currentMap.length) return false;
        if (tileX < 0 || tileX >= currentMap[0].length) return false;
        if (currentMap[tileY][tileX] === 3) return this.isEaten() || this.isInHouse();
        return currentMap[tileY][tileX] !== 1;
    }

    getAvailableDirections(tileX, tileY, currentMap) {
        const directions = [
            DIRECTION_UP,
            DIRECTION_LEFT,
            DIRECTION_BOTTOM,
            DIRECTION_RIGHT,
        ];
        const available = [];

        for (let i = 0; i < directions.length; i++) {
            const direction = directions[i];
            const neighbor = this.getNeighborTile(tileX, tileY, direction, currentMap);
            if (!neighbor) continue;
            if (this.isWalkableTile(neighbor.x, neighbor.y, currentMap)) {
                available.push(direction);
            }
        }

        return available;
    }

    buildDirectionalCandidates(candidates, originTile, currentMap) {
        if (!Array.isArray(candidates) || candidates.length === 0) {
            return [];
        }

        const directionalCandidates = [];
        for (let i = 0; i < candidates.length; i++) {
            const direction = candidates[i];
            const neighbor = this.getNeighborTile(
                originTile.x,
                originTile.y,
                direction,
                currentMap
            );
            if (!neighbor) continue;

            directionalCandidates.push({
                direction,
                x: neighbor.x,
                y: neighbor.y,
            });
        }

        return directionalCandidates;
    }

    setDebugIntent(options = {}) {
        const originTile = options.originTile || null;
        const targetTile = options.targetTile || null;
        const availableDirections = Array.isArray(options.availableDirections)
            ? options.availableDirections.slice()
            : [];
        const candidateTiles = Array.isArray(options.candidateTiles)
            ? options.candidateTiles.map((candidate) => ({
                direction: candidate.direction,
                x: candidate.x,
                y: candidate.y,
            }))
            : [];
        const chosenDirection = Number.isFinite(options.chosenDirection)
            ? options.chosenDirection
            : this.direction;
        const chosenTile =
            candidateTiles.find((candidate) => candidate.direction === chosenDirection) || null;

        this.debugIntent = {
            originTile: originTile
                ? { x: originTile.x, y: originTile.y }
                : null,
            targetTile: targetTile
                ? { x: targetTile.x, y: targetTile.y }
                : null,
            availableDirections,
            candidates: candidateTiles,
            chosenDirection,
            chosenTile: chosenTile ? { x: chosenTile.x, y: chosenTile.y } : null,
            reason: options.reason || "target",
            mode: this.isInHouse() ? "house" : this.isEaten() ? "eaten" : (this.isFrightened() ? "frightened" : ghostGlobalMode),
        };
    }

    pickRandomDirection(candidates) {
        if (!Array.isArray(candidates) || candidates.length === 0) {
            return this.direction;
        }

        if (candidates.length === 1) {
            return candidates[0];
        }

        const randomFn = typeof randomFloat === "function" ? randomFloat : Math.random;
        const order = [DIRECTION_UP, DIRECTION_LEFT, DIRECTION_BOTTOM, DIRECTION_RIGHT];
        const initial = Math.floor(randomFn() * 4);
        for (let offset=0; offset<4; offset++) {
            const direction = order[(initial + offset) % 4];
            if (candidates.includes(direction)) return direction;
        }
        return candidates[0];
    }

    pickDirectionClosestToTarget(
        candidates,
        originTile,
        targetTile,
        currentMap,
        directionalCandidates = null
    ) {
        if (!Array.isArray(candidates) || candidates.length === 0) {
            return this.direction;
        }

        const utils =
            typeof GameplayUtils === "object" && GameplayUtils
                ? GameplayUtils
                : null;
        const normalizedDirectionalCandidates = Array.isArray(directionalCandidates)
            ? directionalCandidates
            : this.buildDirectionalCandidates(candidates, originTile, currentMap);

        if (
            utils &&
            typeof utils.pickGhostDirection === "function" &&
            normalizedDirectionalCandidates.length > 0
        ) {
            const mode = this.isEaten() || this.houseState.exiting ? "eaten" : (this.isFrightened() ? "frightened" : "normal");
            const pickedDirection = utils.pickGhostDirection({
                candidates: normalizedDirectionalCandidates,
                targetTile,
                currentDirection: this.direction,
                personality: this.personality,
                map: currentMap,
                mode,
                maxPathDepth: currentMap.length * currentMap[0].length,
            });
            if (Number.isFinite(pickedDirection)) {
                return pickedDirection;
            }
        }

        let bestDirection = candidates[0];
        let bestScore = Infinity;

        for (let i = 0; i < candidates.length; i++) {
            const direction = candidates[i];
            const neighbor = this.getNeighborTile(
                originTile.x,
                originTile.y,
                direction,
                currentMap
            );
            if (!neighbor) continue;

            const dx = targetTile.x - neighbor.x;
            const dy = targetTile.y - neighbor.y;
            let score = dx * dx + dy * dy;



            if (
                score < bestScore ||
                (score === bestScore &&
                    this.getDirectionPriority(direction) <
                        this.getDirectionPriority(bestDirection))
            ) {
                bestScore = score;
                bestDirection = direction;
            }
        }

        return bestDirection;
    }

    calculateNewDirection(currentMap, destX, destY, decisionTile = null) {
        const originTile = decisionTile || this.getCurrentCenterTile();
        const targetTile = { x: destX, y: destY };
        const availableDirections = this.getAvailableDirections(
            originTile.x,
            originTile.y,
            currentMap
        );

        if (availableDirections.length === 0) {
            this.setDebugIntent({
                originTile,
                targetTile,
                availableDirections,
                candidateTiles: [],
                chosenDirection: this.direction,
                reason: "no-path",
            });
            return this.direction;
        }

        const reverseDirection = this.getOppositeDirection(this.direction);
        let candidates = availableDirections;

        if (candidates.length > 1 && !this.houseState.exiting) {
            const nonReverse = candidates.filter(
                (direction) => direction !== reverseDirection
            );
            if (nonReverse.length > 0) {
                candidates = nonReverse;
            }
        }
        if (!this.isEaten() && !this.isFrightened() && typeof activeMap !== "undefined" &&
            activeMap.restrictedTurns.some(tile => tile.x === originTile.x && tile.y === originTile.y)) {
            const restricted = candidates.filter(direction => direction !== DIRECTION_UP);
            if (restricted.length) candidates = restricted;
        }
        const directionalCandidates = this.buildDirectionalCandidates(
            candidates,
            originTile,
            currentMap
        );

        if (this.isFrightened() && !this.isEaten() && !this.houseState.exiting) {
            const picked = this.pickRandomDirection(candidates);
            this.setDebugIntent({
                originTile,
                targetTile,
                availableDirections,
                candidateTiles: directionalCandidates,
                chosenDirection: picked,
                reason: "frightened-random",
            });
            return picked;
        }

        const pickedDirection = this.pickDirectionClosestToTarget(
            candidates,
            originTile,
            targetTile,
            currentMap,
            directionalCandidates
        );
        this.setDebugIntent({
            originTile,
            targetTile,
            availableDirections,
            candidateTiles: directionalCandidates,
            chosenDirection: pickedDirection,
            reason: "target-closest",
        });
        return pickedDirection;
    }

    getMapX() {
        return parseInt(this.x / oneBlockSize, 10);
    }

    getMapY() {
        return parseInt(this.y / oneBlockSize, 10);
    }

    getMapXRightSide() {
        return parseInt((this.x * 0.99 + oneBlockSize) / oneBlockSize, 10);
    }

    getMapYRightSide() {
        return parseInt((this.y * 0.99 + oneBlockSize) / oneBlockSize, 10);
    }

    draw() {
        const flashing = typeof shouldFlashFrightenedGhosts === "function" && shouldFlashFrightenedGhosts();
        ActorArt.drawRival(canvasContext, this, flashing);
    }
}

let updateGhosts = () => {
    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].moveProcess();
    }
};

let drawGhosts = () => {
    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].draw();
    }
};
