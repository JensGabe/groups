export class BuildConfiguration {
    private readonly boys: string[];
    private readonly girls: string[];
    readonly distributions: Distribution[];
    constructor(boys: string[], girls: string[], minBoys: number, minGirls: number) {
        this.boys = boys;
        this.girls = girls;
        this.distributions = this.build(minBoys, minGirls);
        console.log(`[${this.distributions}]`);
    }

    getBoys(): string[] {
        return this.boys.slice(0);
    }

    getGirls(): string[] {
        return this.girls.slice(0);
    }

    private build(minBoys: number, minGirls: number): Distribution[] {
        const res: Distribution[] = [];
        let boyCount = this.boys.length;
        let girlCount = this.girls.length;
        const minGroupSize = minBoys + minGirls;
        while (boyCount >= minBoys && girlCount >= minGirls) {
            const dist = new Distribution();
            dist.boys = minBoys;
            boyCount -= minBoys;
            dist.girls = minGirls;
            girlCount -= minGirls;
            res.push(dist);
        }
        while (boyCount >= minGroupSize) {
            const dist = new Distribution();
            dist.boys = minGroupSize;
            boyCount -= minGroupSize;
            res.push(dist);
        }
        while (girlCount >= minGroupSize) {
            const dist = new Distribution();
            dist.girls = minGroupSize;
            girlCount -= minGroupSize;
            res.push(dist);
        }
        for (let i = 0; i < girlCount; i++) {
            res[i % res.length].girls++;
        }
        for (let i = 0; i < boyCount; i++) {
            res[(girlCount + i) % res.length].boys++;
        }
        return res;
    }

}

export class Builder {
    rounds: Round[] = [];
    private costMatrix = new Costs();
    private hostCosts = new Costs();
    constructor() {
    }

    getRounds(): Round[] {
        return this.rounds.slice(0);
    }

    setCosts(costs: Costs) {
        this.costMatrix = costs;
    }

    buildRound(config: BuildConfiguration, maxIterations: number) {
        let lowestCostRound: Round = null;
        let round: Round;
        for (let i = 0; i < maxIterations; i++) {
            round = new Round(config, this.costMatrix);
            if (lowestCostRound == null || round.cost < lowestCostRound.cost) {
                lowestCostRound = round;
                if (lowestCostRound.cost === 0) {
                    break;
                }
            }
        }
        this.costMatrix.updateCosts(lowestCostRound);
        this.assignHosts(lowestCostRound);
        this.rounds.push(lowestCostRound);
        console.log(`${this.rounds.length}\t${lowestCostRound}`);
    }

    assignHosts(round: Round) {
        const roundHosts: string[] = [];
        for (const group of round.groups) {
            let lowestCost = Number.POSITIVE_INFINITY;
            let lowestCostHost: string = null;
            for (const member of shuffle(group.members)) {
                const memberCost = this.hostCosts.get(member);
                if (memberCost === 0) {
                    lowestCostHost = member;
                    lowestCost = 0;
                    break;
                }
                if (memberCost < lowestCost) {
                    lowestCostHost = member;
                    lowestCost = memberCost;
                }
            }
            group.host = lowestCostHost;
            group.hostCost = lowestCost;
            roundHosts.push(group.host);
        }
        this.hostCosts.updateCosts({
            keys(): string[] { return roundHosts; }
        });
    }


    /**
     * Updates the cost matrix. Degrades the current values, and adds 1 for each new addition.
     * @param additions The new additions
     */
    updateCostMatrix(additions: HasKeys) {
        this.costMatrix.updateCosts(additions);
    }

}

export class Distribution {
    boys: number = 0;
    girls: number = 0;
    constructor() {
    }
    toString(): string {
        return this.boys + ':' + this.girls;
    }
}

class Costs {
    private costs: { [key: string]: number; } = {};
    constructor() {
    }

    get(key: string): number {
        return this.costs[key] || 0;
    }

    getCosts(obj: HasKeys): number {
        let res: number = 1;
        for (const key of obj.keys()) {
            const keyCost = this.costs[key];
            if (keyCost) {
                res *= (1 + keyCost);
            }
        }
        return res > 1 ? res * res : 0;
    }

    /**
     * Updates the cost matrix. Degrades the current values, and adds 1 for each new addition.
     * @param additions The new additions
     */
    updateCosts(additions: HasKeys) {
        let key;
        for (key in this.costs) {
            if (this.costs.hasOwnProperty(key)) {
                this.costs[key] = this.costs[key] * .7;
            }
        }
        for (key of additions.keys()) {
            if (this.costs[key]) {
                this.costs[key] += 1;
            } else {
                this.costs[key] = 1;
            }
        }
    }
}

export interface HasKeys {
    keys(): string[];
}


export class Round implements HasKeys {
    readonly groups: Group[] = [];
    readonly cost: number;
    /**
     * Builds the groups from the distribution definition.
     * @param dists The Distribution definitions
     * @returns The populated groups
     */
    constructor(config: BuildConfiguration, costs: Costs) {
        const boys: string[] = shuffle(config.getBoys());
        const girls: string[] = shuffle(config.getGirls());
        for (const dist of config.distributions) {
            const group = new Group();
            group.populate(boys, dist.boys);
            group.populate(girls, dist.girls);
            this.groups.push(group);
        }
        this.cost = this.getCost(costs);
    }

    /**
     * Calcuate the cost of the round
     * @param costs The cost matrix
     * @return The round cost
     */
    private getCost(costs: Costs): number {
        let res: number = 0;
        for (const group of this.groups) {
            const groupCost = costs.getCosts(group);
            group.cost = groupCost;
            res += groupCost * groupCost;
        }
        return res;
    }

    toString(): string {
        return `${this.cost}\t[${this.groups}]`;
    }

    keys(): string[] {
        const values: string[] = [];
        for (const group of this.groups) {
            for (const member of group.keys()) {
                values.push(member);
            }
        }
        return values;
    }

}

export class Group implements HasKeys {
    readonly members: string[] = [];
    cost: number;
    host: string;
    hostCost: number;
    constructor() {
    }

    /**
     * Moves the requested amount from the source to the group.
     * @param from The source
     * @param count The amount to add from the source
     */
    populate(from: string[], count: number) {
        for (let i = 0; i < count; i++) {
            this.members.push(from[0]);
            from.splice(0, 1);
        }
    }

    toString(): string {
        return `[(${this.host}:${this.hostCost}):${this.cost}:${this.members}]`;
    }

    keys(): string[] {
        const values: string[] = [];
        const l = this.members.length;
        let p1: string, p2: string, i1: number, i2: number;
        for (i1 = 0; i1 < l; i1++) {
            p1 = this.members[i1];
            for (i2 = i1 + 1; i2 < l; i2++) {
                p2 = this.members[i2];
                if (p1 > p2) {
                    [p1, p2] = [p2, p1];
                }
                values.push(p1 + '::' + p2);
            }
        }
        return values;
    }
}

/**
 * Creates a new shuffled (Randomizes) array.
 * @param array The array
 * @returns The shuffled array
 */
function shuffle(array: string[]): string[] {
    array = array.slice(0);
    for (let temp: string, j: number, i = array.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
