$(function(){

	App = {
		Models: {},
		Collections: {},
		Views: {},
		Variables: {}
	};

	/*
	 * @param {string} id - the id of the template to be applied, previously defined in HTML
	 * @returns template for the item resulting from a search
	 */
	window.ResultsTemplate = function(id) {
		return _.template( $('#'+id).html() );
	};

	/*
	 * @param {string} id - the id of the template to be applied, previously defined in HTML
	 * @returns template for the selected item
	 */
	window.SelectedTemplate = function(id) {
		return _.template( $('#'+id).html() );
	};

	/*
	 * ==============================================
	 *	VARIABLES
	 * ==============================================
	 */
	App.Variables.calorieCount = 0;

	/*
	 * ==============================================
	 *	MODELS
	 * ==============================================
	 */

	//Ingredient result
	App.Models.Ingredient = Backbone.Model.extend({
		defaults: {
			title: 'Ingredient or Meal Title',
			calories: 150,
			selected: false
		}
	});

	//Calories counter
	App.Models.Counter = Backbone.Model.extend({
		defaults: {
			value: 0,
			goal: 0
		}
	});

	/*
	 * ==============================================
	 *	COLLECTIONS
	 * ==============================================
	 */
	App.Collections.ResultsIngredients = Backbone.Collection.extend({
		model: App.Models.Ingredient
	});

	App.Collections.SelectedIngredients = Backbone.Collection.extend({
		model: App.Models.Ingredient
	});

	/*
	 * ==============================================
	 *	VIEWS
	 * ==============================================
	 */

	 	/*
		 * ==============================================
		 *	SEARCH VIEW
		 * ==============================================
		 */

	App.Views.Search = Backbone.View.extend({
		el: '.start-screen-content',

		events: {
			'click .start-screen-button': 'fetchData'
		},

		initialize: function() {
			_.bindAll(this, 'fetchData');
		},

		/*
		 * @description This function gets the user input from the input fields
		 * Sets the goal property to display a personalized message. The makes an AJAX request
		 * to the nutrixionix API, fetched data, updates the corresponding values and scrolls the screen
		 * to the next screen when the data has been received and everything has been rendered.
		 * @param e {object}
		 */
		fetchData: function(e) {
			e.preventDefault();

			//Refresh the div
			resultsIngredientsView.deleteAll();

			//Get user input
			var userInput = $('input.search-input-field').val();
			var goalInput = $('input.goal-input-field').val();

			//Set the goal property
			if (isNaN(parseInt(goalInput))){

				counter.set('goal',  "Please set a valid number");

			} else if (goalInput != undefined && goalInput != 0) {

				counter.set('goal', goalInput);

			}

			counterView.updateGoal();

			//Search settings
			var nutritionixAppID = "af279fb8";
			var nutritionixAppKey = "0bbbd1a7d62c24b06fef93217721612a";
			var numberOfResults = '50'

			var url = 'https://api.nutritionix.com/v1_1/search/' + userInput + '?results=0:'+ numberOfResults + '&fields=*&appId=' + nutritionixAppID + '&appKey=' + nutritionixAppKey;

			//Ajax request
			$.getJSON(url, function(data) {

				var results = data.hits;
				var i;

				for(i=0; i<results.length; i++) {

					var currentResult = results[i].fields;

					var itemName = currentResult.item_name;
					var itemBrand = currentResult.brand_name;
					var itemCalories = currentResult.nf_calories;

					var ingredientData = {
						title: itemBrand + ' ' + itemName ,
						calories: itemCalories + ' ' + 'cal'
					}

					resultsIngredients.add(ingredientData);
				}

				// Scroll Animation
				var offset = $(".search-results-screen").offset();

				$("html, body").animate({
					scrollTop: offset.top,
				});

			}).error(function(e) {

				alert('There was an error looking for that ingredient');

			});
		}
	});


	 	/*
		 * ==============================================
		 *	SINGLE INGREDIENT RESULT VIEW
		 * ==============================================
		 */

	 App.Views.ResultsIngredient = Backbone.View.extend({
		tagName: 'div',
		className: 'ingredient-main-div row',
		template: ResultsTemplate('ingredients-template'),

		events: {
			'click .add-icon': 'select',
		},

		initialize: function() {
			_.bindAll(this, 'render', 'select');
			this.render();
		},

		render: function() {
			var ingredientTemplate = this.template(this.model.toJSON());
			this.$el.html(ingredientTemplate);
			return this;
		},

		/*
		 * @description Selects an ingredient, plays a sound and adds the ingredient to the selected ingredients model
		 */
		select: function() {

			//Play sound when the ingredient is selected
			var sound = new Audio('sound/Click On-SoundBible.com-1697535117.mp3');
			sound.play();

			//Change the selected attribute of the ingredient and
			// add it to the selected ingredients model
			var clickedIngredient = this.model;
			clickedIngredient.set('selected', true);
			selectedIngredients.add(clickedIngredient);
		}

	 });

	 	/*
		 * ==============================================
		 *	SELECTED INGREDIENT INDIVIDUAL VIEW
		 * ==============================================
		 */

	 App.Views.SelectedIngredient = Backbone.View.extend({
		tagName: 'div',
		className: 'ingredient-main-div selected-ingredient row',
		template: SelectedTemplate('selected-ingredient-template'),

		events: {
			'click .remove': 'unselect'
		},

		initialize: function() {
			_.bindAll(this, 'render', 'unselect');
			this.render();
		},

		render: function() {
			var ingredientTemplate = this.template(this.model.toJSON());
			this.$el.html(ingredientTemplate);
			return this;
		},

		/*
		 * @description To unselect an ingredient. Plays a sound and removes the ingredient from
		 * the model of selected ingredients and from the DOM
		 */
		unselect: function() {

			//Play sound when the ingredient is unselected
			var sound = new Audio('sound/Click On-SoundBible.com-1697535117.mp3');
			sound.play();

			//Remove the ingredient from the selected ingredients
			// model and remove it form the DOM
			var clickedIngredient = this.model;
			selectedIngredients.remove(clickedIngredient);
			this.$el.remove();
		}

	 });

	 	/*
		 * ==============================================
		 *	INITIAL RESULTS VIEW
		 * ==============================================
		 */

	 App.Views.Results = Backbone.View.extend({
		el: '.api-results-container',

		initialize: function() {
			_.bindAll(this, 'render', 'addIngredient');
			this.collection.on('add', this.addIngredient);
		},

		render: function() {
			this.collection.each(this.addIngredient, this);
			return this;
		},

		/*
		 * @param ingredient {object} the ingredient
		 */
		addIngredient: function(ingredient) {
			var selected = ingredient.get('selected');

			if(!selected) {

				var ingredientView = new App.Views.ResultsIngredient({model: ingredient});
				this.$el.append(ingredientView.render().el);
			}
		},

		/*
		 * @description Deletes all the ingredients from the results section and emptys the DOM
		 */
		deleteAll: function() {
			//Reset the model
			resultsIngredients.reset();
			//Reset the view
			this.$el.empty();
		}
	 });


		/*
		 * ==============================================
		 *	SELECTED INGREDIENTS VIEW
		 * ==============================================
		 */

	App.Views.Selected = Backbone.View.extend({
		el: '.selected-ingredients-container',

		initialize: function() {
			_.bindAll(this, 'render', 'addSelectedIngredient');
			this.collection.on('add', this.addSelectedIngredient);
			this.collection.on('remove', this.removeSelectedIngredient);
		},

		render: function() {
			this.collection.each(this.addSelectedIngredient, this);
			return this;
		},

		/*
		 * @description Adds the selected ingredient to the correct section, updated the counter model and view
		 * and updates the goal
		 * @param ingredient {object} - the selected ingredient
		 */
		addSelectedIngredient: function(ingredient) {

			var numCalories = this.formatCalories(ingredient);

			this.updateCounter(numCalories);

			var selectedIngredientView = new App.Views.SelectedIngredient({model: ingredient});
			this.$el.append(selectedIngredientView.render().el);

			this.updateGoal();

		},

		updateCounter: function(numCalories) {
			// Update the counter
			var newValue = counter.get('value') + numCalories;
			counter.set('value', newValue);

			//Update the counter
			counterView.render();
		},

		updateGoal: function() {
			//Update the goal
			counterView.updateGoal();
		},

		/*
		 * @description Takes an ingredient and gets how many calories it contains
		 * formats it into a number.
		 * @param ingredient {object} - the ingredient
		 * @returns {int} - the number of calories it contains
		 */
		formatCalories: function(ingredient) {
			var numOfCalories= Number(ingredient.get('calories').split(' ')[0]);
			return numOfCalories;
		},

		/*
		 * @description - Removes the ingredient from the selected view, and updates the counter
		 * @param ingredient {object} - the ingredient to be removed
		 */
		removeSelectedIngredient: function(ingredient) {

			var numCalories = Number(ingredient.get('calories').split(' ')[0]);
			var newValue = counter.get('value') - numCalories;

			counter.set('value', newValue);
			counterView.render();
			//Update the goal
			counterView.updateGoal();
		}
	});

		/*
		 * ==============================================
		 *	COUNTER VIEW
		 * ==============================================
		 */

	App.Views.Counter = Backbone.View.extend({
		tagName: 'p',
		className: 'total-calories-text',

		message: "Please set a valid number",

		initialize: function() {
			_.bindAll(this, 'render');
			this.render();
		},

		render: function() {

			this.$el.text(counter.get('value') + ' ' + 'cal');
			$('.total-calories-circle-div').append(this.el);

			return this;
		},

		/*
		 * @description This function updates the user's final message
		 * according to the initial goal he/she set at the start.
		 */
		updateGoal: function() {
			var totalCalories = counter.get('value');
			var userGoal = counter.get('goal');

			if(userGoal== this.message){

				$('.total-calories-message').text(userGoal);

			} else {

				if(userGoal < totalCalories){
					$('.total-calories-message').text("You didn't meet your goal of " + userGoal + " calories, keep trying! ");
				} else {
					$('.total-calories-message').text("Great job! You reached you goal of " + userGoal + " calories for today");
				}
			}

		}
	});

		/*
		 * ==============================================
		 *	BUTTONS VIEW
		 * ==============================================
		 */
	App.Views.Buttons = Backbone.View.extend({
		el: '.search-results-title-div',

		events: {
			'click .results-return-button': 'jumpToStart',
			'click .results-next-button': 'jumpToSelected',
			'click .selected-return-button': 'jumpToResults',
			'click .selected-next-button': 'jumpToCalories',
			'click .total-calories-return-button': 'jumpToSelected'
		},

		initialize: function() {
			_.bindAll(this, 'render');
		},

		jumpToStart: function() {
			// Scroll Animation
			var offset = $(".main-container").offset();

			$("html, body").animate({
				scrollTop: offset.top,
			});
		},

		jumpToSelected: function() {
			// Scroll Animation
			var offset = $(".my-menu-main").offset();

			$("html, body").animate({
				scrollTop: offset.top,
			});
		},

		jumpToResults: function() {
			// Scroll Animation
			var offset = $(".search-results").offset();

			$("html, body").animate({
				scrollTop: offset.top,
			});
		},

		jumpToCalories: function() {
			// Scroll Animation
			var offset = $(".total-calories-screen").offset();

			$("html, body").animate({
				scrollTop: offset.top,
			});
		}

	});


	/*
	 * ==============================================
	 *	INSTANCES
	 * ==============================================
	 */

	 //Models
	var counter = new App.Models.Counter();

	// Collections
	var resultsIngredients = new App.Collections.ResultsIngredients({});
	var selectedIngredients = new App.Collections.SelectedIngredients({});

	//Views
	var counterView = new App.Views.Counter({model: counter});
	var resultsIngredientsView = new App.Views.Results({collection: resultsIngredients});
	var selectedIngredientsView = new App.Views.Selected({collection: selectedIngredients})
	var searchView = new App.Views.Search();
	var buttonsView = new App.Views.Buttons();
});