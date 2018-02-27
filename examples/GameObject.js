/**
 * Represents an object in the game
 */
class GameObject {

	/**
	 * Creates an instance with specific name and health
	 * @param {string} name
	 *   The name of the object
	 * @param {number} health
	 *   The health of the object
	 */
	constructor(name, health) {
		this.name = name
		this.health = health
		this.state = 'alive'
	}

	/**
	 * Takes specific amount of damage
	 * @param {number} amount
	 *   Amount of damage to take
	 * @example Attack a kobold
	 * ```js
	 * var enemy = new GameObject('Kobold', 10)
	 * enemy.takeDamage(5)
	 * console.log(`Health lefts ${this.health}`)
	 * ```
	 * @example Attack a rat and kill it
	 * ```js
	 * var enemy = new GameObject('Rat', 3)
	 * enemy.takeDamage(5)
	 * console.log(`${this.name} must be dead`)
	 * ```
	 */
	takeDamage(amount) {
		this.health -= amount
		console.log(`${this.name} took ${amount} damage`)
		if (this.health < 0) this.die()
	}

	die() {
		this.state = 'dead'
		console.log(`${this.name} is killed`)
	}
}
