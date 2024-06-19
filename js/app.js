let currentWorkoutDay = 1;  // Track the current day
let currentNutritionDay = 1;  // Track the current day

document.addEventListener('DOMContentLoaded', () => {

    // Initialize Supabase
    function initializeSupabase() {
        const supabaseUrl = '';
        const supabaseAnonKey = '';
        if (typeof supabaseClient === 'undefined') {
            window.supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
        }
    }
    
    initializeSupabase();

    // Profile Section
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', saveProfile);

    const startImageUpload = document.getElementById('startImageUpload');
    startImageUpload.addEventListener('change', handleImageUpload);

    const monthContainer = document.getElementById('monthContainer');
    const monthUploads = monthContainer.querySelectorAll('input[type="file"]');
    monthUploads.forEach(upload => upload.addEventListener('change', handleImageUpload));

    const yearButtons = document.querySelectorAll('.year-button');
    yearButtons.forEach(button => button.addEventListener('click', switchYear));

    async function saveProfile(event) {
        if (event) event.preventDefault();
        const formData = new FormData(profileForm);
        const profileData = {};
        formData.forEach((value, key) => {
            profileData[key.toLowerCase()] = value; // Ensure all keys are lowercase
        });

        // Include workout and nutrition days
        profileData.currentworkoutday = currentWorkoutDay;
        profileData.currentnutritionday = currentNutritionDay;

    
        // Include goal measurements in profileData
        profileData.goalarmmeasurement = document.getElementById('goalArmMeasurement').value;
        profileData.goalcalfmeasurement = document.getElementById('goalCalfMeasurement').value;
        profileData.goalthighmeasurement = document.getElementById('goalThighMeasurement').value;
        profileData.goalbuttmeasurement = document.getElementById('goalButtMeasurement').value;
    
        // Include total weight lifted
        profileData.totalweight = document.getElementById('totalWeight').textContent;
    
        // Include images
        profileData.images = JSON.parse(localStorage.getItem('profileData')).images;
    
        // Include table data
        const tableRows = document.querySelectorAll('#nutritionLog tbody tr');
        profileData.nutritionlog = Array.from(tableRows).map(row => {
            const workoutData = {};
            row.querySelectorAll('td[data-workout]').forEach(td => {
                workoutData[td.dataset.workout] = td.textContent;
            });
    
            return {
                day: row.dataset.day,
                water: row.children[1].textContent,
                calories: row.children[2].textContent,
                vitamins: row.children[3].textContent,
                sleep: row.children[4].textContent,
                workouts: workoutData
            };
        });
    
        localStorage.setItem('profileData', JSON.stringify(profileData));
        alert('Profile saved!');
    
        // Check if profile exists
        const existingProfile = await getProfileByName(profileData.name);
        if (existingProfile) {
            // Update existing profile
            const supabaseResponse = await updateProfile(existingProfile.id, profileData);
            if (supabaseResponse) {
                console.log('Profile updated in Supabase:', supabaseResponse);
            }
        } else {
            // Create new profile
            const supabaseResponse = await createProfile(profileData);
            if (supabaseResponse) {
                console.log('Profile created in Supabase:', supabaseResponse);
            }
        }
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.getElementById(event.target.id.replace('Upload', 'Image'));
                img.src = e.target.result;
                img.style.display = 'block';
                handleNextUpload(event.target.id);

                // Save image data to profileData
                const profileData = JSON.parse(localStorage.getItem('profileData')) || {};
                profileData.images = profileData.images || {};
                profileData.images[event.target.id] = e.target.result;
                localStorage.setItem('profileData', JSON.stringify(profileData));
            };
            reader.readAsDataURL(file);
        }
    }

    function handleNextUpload(currentUploadId) {
        const nextUploadId = `month${parseInt(currentUploadId.replace('month', '').replace('Upload', '')) + 1}Upload`;
        const nextUpload = document.getElementById(nextUploadId);
        if (nextUpload) {
            nextUpload.disabled = false;
        } else {
            const currentYear = Math.floor(parseInt(currentUploadId.replace('month', '').replace('Upload', '')) / 12) + 1;
            const addYearButton = document.querySelector(`.year-button[data-year="${currentYear + 1}"]`);
            addYearButton.style.display = 'block';
        }
    }

    function switchYear(event) {
        const year = event.target.getAttribute('data-year');
        document.querySelectorAll('.calendar').forEach(calendar => {
            calendar.style.display = 'none';
        });
        document.getElementById(`year${year}`).style.display = 'flex';
    }

// Goal Setting Section
const goalForm = document.getElementById('goalForm');
goalForm.addEventListener('submit', generateAIPlan);
goalForm.addEventListener('input', calculatePercentImprovements);

function calculatePercentImprovements() {
    const currentArm = parseFloat(document.getElementById('armMeasurement').value) || 0;
    const goalArm = parseFloat(document.getElementById('goalArmMeasurement').value) || 0;
    const percentArm = calculatePercentage(currentArm, goalArm);
    document.getElementById('percentImprovementArm').value = percentArm + '%';

    const currentCalf = parseFloat(document.getElementById('calfMeasurement').value) || 0;
    const goalCalf = parseFloat(document.getElementById('goalCalfMeasurement').value) || 0;
    const percentCalf = calculatePercentage(currentCalf, goalCalf);
    document.getElementById('percentImprovementCalf').value = percentCalf + '%';

    const currentThigh = parseFloat(document.getElementById('thighMeasurement').value) || 0;
    const goalThigh = parseFloat(document.getElementById('goalThighMeasurement').value) || 0;
    const percentThigh = calculatePercentage(currentThigh, goalThigh);
    document.getElementById('percentImprovementThigh').value = percentThigh + '%';

    const currentButt = parseFloat(document.getElementById('buttMeasurement').value) || 0;
    const goalButt = parseFloat(document.getElementById('goalButtMeasurement').value) || 0;
    const percentButt = calculatePercentage(currentButt, goalButt);
    document.getElementById('percentImprovementButt').value = percentButt + '%';
}

function calculatePercentage(current, goal) {
    if (current === 0) return 0;
    return (((goal - current) / current) * 100).toFixed(2);
}

    function generateAIPlan(event) {
        event.preventDefault();
        alert('AI Plan Generated!');
        // Add AI plan generation logic here
    }

    // Workout Section
    const doneWorkoutButton = document.getElementById('doneWorkout');
    const workoutContainer = document.getElementById('workoutContainer');

    doneWorkoutButton.addEventListener('click', () => {
        const tbody = document.querySelector('#nutritionLog tbody');
        let currentRow = tbody.querySelector(`tr[data-day="${currentWorkoutDay}"]`);
        
        if (!currentRow) {
            currentRow = document.createElement('tr');
            currentRow.setAttribute('data-day', currentWorkoutDay);
            currentRow.innerHTML = `<td>Day ${currentWorkoutDay}</td><td></td><td></td><td></td><td></td>`;
            tbody.appendChild(currentRow);
        }
        
        const workoutSlots = workoutContainer.querySelectorAll('.workout-slot');
        
        workoutSlots.forEach(slot => {
            const title = slot.querySelector('h3').textContent.split(' ')[0]; // Get the workout name
            const inputs = slot.querySelectorAll('input');
            let workoutData = [];
            
            for (let i = 0; i < inputs.length; i += 2) {
                const lbs = inputs[i].value || 0;
                const reps = inputs[i + 1].value || 0;
                workoutData.push(`${lbs}x${reps}`);
            }
            
            const workoutString = workoutData.join(', ');
            let newCell = currentRow.querySelector(`td[data-workout="${title}"]`);
            
            if (!newCell) {
                newCell = document.createElement('td');
                newCell.setAttribute('data-workout', title);
                currentRow.appendChild(newCell);
            }
            
            newCell.textContent = workoutString;
            
            // Reset inputs
            inputs.forEach(input => input.value = '');
        });
        
        currentWorkoutDay++; // Increment the workout day after processing
        saveCurrentDayState(); // Save the updated day state
        saveProfile(); // Save the profile after updating the day state
    });

    // Nutrition Section for Water Intake
    const addWaterButton = document.getElementById('addWater');
    const waterInput = document.getElementById('water');
    const waterTotal = document.getElementById('waterTotal');
    const waterButtonsContainer = document.getElementById('waterButtonsContainer');

    addWaterButton.addEventListener('click', () => {
        const waterAmount = parseInt(waterInput.value) || 0;
        if (waterAmount > 0) {
            addWater(waterAmount);
        }
    });

    document.querySelectorAll('.waterButton').forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseInt(button.getAttribute('data-amount'));
            addWater(amount);
        });
    });

    function addWater(amount) {
        const currentTotal = parseInt(waterTotal.textContent.split('/')[0].replace('Total: ', ''));
        const newTotal = currentTotal + amount;
        waterTotal.textContent = `Total: ${newTotal}/120 oz`;
        addWaterButtonElement(amount);
    }

    function addWaterButtonElement(amount) {
        if (![...waterButtonsContainer.children].some(button => parseInt(button.textContent) === amount)) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'waterButton';
            button.dataset.amount = amount;
            button.textContent = `${amount}oz`;
            button.addEventListener('click', () => addWater(amount));
            waterButtonsContainer.appendChild(button);
            sortButtons(waterButtonsContainer, 'data-amount');
        }
    }

    function sortButtons(container, dataAttribute) {
        const buttons = [...container.children];
        buttons.sort((a, b) => parseInt(a.getAttribute(dataAttribute)) - parseInt(b.getAttribute(dataAttribute)));
        container.innerHTML = '';
        buttons.forEach(button => container.appendChild(button));
    }

    const resetWaterButton = document.getElementById('resetWater');
    resetWaterButton.addEventListener('click', () => {
        waterTotal.textContent = 'Total: 0/120 oz';
    });

    // Nutrition Section for Calories Intake
    const addCalorieButton = document.getElementById('addCalorie');
    const calorieInput = document.getElementById('calorieInput');
    const caloriesTotal = document.getElementById('caloriesTotal');
    const calorieButtonsContainer = document.getElementById('calorieButtonsContainer');

    addCalorieButton.addEventListener('click', () => {
        const calorieText = calorieInput.value.trim();
        if (calorieText) {
            addCalorieButtonElement(calorieText);
        }
    });

    function addCalorieButtonElement(text) {
        const amountMatch = text.match(/\((\d+)\)/);
        if (amountMatch && ![...calorieButtonsContainer.children].some(button => button.textContent === text)) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'calorieButton';
            button.dataset.calories = amountMatch[1];
            button.textContent = text;
            button.addEventListener('click', () => addCalories(amountMatch[1]));
            calorieButtonsContainer.appendChild(button);
            sortButtons(calorieButtonsContainer, 'data-calories');
        }
    }

    function sortButtons(container, dataAttribute) {
        const buttons = [...container.children];
        buttons.sort((a, b) => parseInt(a.getAttribute(dataAttribute)) - parseInt(b.getAttribute(dataAttribute)));
        container.innerHTML = '';
        buttons.forEach(button => container.appendChild(button));
    }

    function addCalories(amount) {
        const currentTotal = parseInt(caloriesTotal.textContent.split('/')[0].replace('Total: ', ''));
        const newTotal = currentTotal + parseInt(amount);
        caloriesTotal.textContent = `Total: ${newTotal}/3000 calories`;
    }

    const resetCaloriesButton = document.getElementById('resetCalories');
    resetCaloriesButton.addEventListener('click', () => {
        caloriesTotal.textContent = 'Total: 0/3000 calories';
    });

    // Add existing calorie buttons event listeners
    document.querySelectorAll('.calorieButton').forEach(button => {
        button.addEventListener('click', () => {
            addCalories(button.getAttribute('data-calories'));
        });
    });

    // Vitamins Section
    const addVitaminButton = document.getElementById('addVitamin');
    const vitaminInput = document.getElementById('vitaminInput');
    const vitaminsTotal = document.getElementById('vitaminsTotal');
    const vitaminButtonsContainer = document.getElementById('vitaminButtonsContainer');

    addVitaminButton.addEventListener('click', () => {
        const vitaminText = vitaminInput.value.trim();
        if (vitaminText) {
            addVitaminButtonElement(vitaminText);
        }
    });

    function addVitaminButtonElement(text) {
        const amountMatch = text.match(/\((\d+)\)/);
        if (amountMatch && ![...vitaminButtonsContainer.children].some(button => button.textContent === text)) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'vitaminButton';
            button.dataset.vitamins = amountMatch[1];
            button.textContent = text;
            button.addEventListener('click', () => addVitamins(amountMatch[1]));
            vitaminButtonsContainer.appendChild(button);
            sortButtons(vitaminButtonsContainer, 'data-vitamins');
        }
    }

    function addVitamins(amount) {
        const currentTotal = parseInt(vitaminsTotal.textContent.split('/')[0].replace('Total: ', ''));
        const newTotal = currentTotal + parseInt(amount);
        vitaminsTotal.textContent = `Total: ${newTotal}/1000 mg`;
    }

    const resetVitaminsButton = document.getElementById('resetVitamins');
    resetVitaminsButton.addEventListener('click', () => {
        vitaminsTotal.textContent = 'Total: 0/1000 mg';
    });

    // Sleep Section
    const addSleepButton = document.getElementById('addSleep');
    const sleepInput = document.getElementById('sleepInput');
    const sleepTotal = document.getElementById('sleepTotal');
    const sleepButtonsContainer = document.getElementById('sleepButtonsContainer');

    addSleepButton.addEventListener('click', () => {
        const sleepHours = parseInt(sleepInput.value) || 0;
        if (sleepHours > 0) {
            addSleepHours(sleepHours);
        }
    });

    function addSleepHours(hours) {
        const currentTotal = parseInt(sleepTotal.textContent.split('/')[0].replace('Total: ', ''));
        const newTotal = currentTotal + hours;
        sleepTotal.textContent = `Total: ${newTotal}/8 hours`;
        addSleepButtonElement(hours);
    }

    function addSleepButtonElement(hours) {
        // Only add new buttons for hours not already present
        if (![...sleepButtonsContainer.children].some(button => parseInt(button.getAttribute('data-hours')) === hours)) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'sleepButton';
            button.dataset.hours = hours;
            button.textContent = `${hours} hours`;
            button.addEventListener('click', () => addSleepHours(hours));
            sleepButtonsContainer.appendChild(button);
            sortButtons(sleepButtonsContainer, 'data-hours');
        }
    }

    const resetSleepButton = document.getElementById('resetSleep');
    resetSleepButton.addEventListener('click', () => {
        sleepTotal.textContent = 'Total: 0/8 hours';
    });

    // Add existing vitamin buttons event listeners
    document.querySelectorAll('.vitaminButton').forEach(button => {
        button.addEventListener('click', () => {
            addVitamins(button.getAttribute('data-vitamins'));
        });
    });

    // Event listeners for default sleep buttons
    document.querySelectorAll('.sleepButton').forEach(button => {
        button.addEventListener('click', (event) => {
            addSleepHours(parseInt(event.target.dataset.hours));
        });
    });

    // Sort buttons function
    function sortButtons(container, dataAttribute) {
        const buttons = [...container.children];
        buttons.sort((a, b) => parseInt(a.getAttribute(dataAttribute)) - parseInt(b.getAttribute(dataAttribute)));
        container.innerHTML = '';
        buttons.forEach(button => container.appendChild(button));
    }

    // Nutrition Section
    const doneNutritionButton = document.getElementById('doneNutrition');
    doneNutritionButton.addEventListener('click', () => {
        const tbody = document.querySelector('#nutritionLog tbody');
        let currentRow = tbody.querySelector(`tr[data-day="${currentNutritionDay}"]`);
        
        if (!currentRow) {
            currentRow = document.createElement('tr');
            currentRow.setAttribute('data-day', currentNutritionDay);
            currentRow.innerHTML = `<td>Day ${currentNutritionDay}</td><td></td><td></td><td></td><td></td>`;
            tbody.appendChild(currentRow);
        }
        
        const waterIntake = waterTotal.textContent.split(': ')[1].split('/')[0];
        const calorieIntake = caloriesTotal.textContent.split(': ')[1].split('/')[0];
        const vitaminIntake = vitaminsTotal.textContent.split(': ')[1].split('/')[0];
        const sleepHours = sleepTotal.textContent.split(': ')[1].split('/')[0];
        
        currentRow.children[1].textContent = `${waterIntake} oz`;
        currentRow.children[2].textContent = `${calorieIntake} cals`;
        currentRow.children[3].textContent = `${vitaminIntake} mg`;
        currentRow.children[4].textContent = `${sleepHours} hrs`;
        
        resetWaterButton.click();
        resetCaloriesButton.click();
        resetVitaminsButton.click();
        resetSleepButton.click();
        
        currentNutritionDay++; // Increment the nutrition day after processing
        saveCurrentDayState(); // Save the updated day state
        saveProfile(); // Save the profile after updating the day state
    });

    // Analysis Section
    const totalWeightElement = document.getElementById('totalWeight');
    const weightUsedInputs = document.querySelectorAll('#workoutContainer input[placeholder="lbs"]');
    const repsInputs = document.querySelectorAll('#workoutContainer input[placeholder="reps"]');

    weightUsedInputs.forEach((input, index) => {
        input.addEventListener('input', updateTotalWeight);
        repsInputs[index].addEventListener('input', updateTotalWeight);
    });

    function updateTotalWeight() {
        let totalWeight = 0;
        weightUsedInputs.forEach((input, index) => {
            const weight = parseInt(input.value) || 0;
            const reps = parseInt(repsInputs[index].value) || 0;
            totalWeight += weight * reps;
        });
        totalWeightElement.textContent = totalWeight;
    }

    // Highlight selected workout duration button
    document.querySelectorAll('.duration-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const parent = event.target.parentNode;
            parent.querySelectorAll('.duration-button').forEach(btn => btn.classList.remove('selected'));
            event.target.classList.add('selected');
            const durationDisplay = parent.querySelector('span');
            durationDisplay.textContent = `${event.target.dataset.duration} min`;
        });
    });
});

// Supabase Functions
async function createProfile(profileData) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .insert([profileData]);
        if (error) throw error;
        console.log('Profile created:', data);
    } catch (error) {
        console.error('Error creating profile:', error);
    }
}

async function updateProfile(id, profileData) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .update(profileData)
            .eq('id', id);
        if (error) throw error;
        console.log('Profile updated:', data);
    } catch (error) {
        console.error('Error updating profile:', error);
    }
}

async function getProfileByName(name) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('name', name)
            .single();
        if (error) {
            if (error.message === 'JSON object requested, multiple (or no) rows returned') {
                return null;
            }
            throw error;
        }
        return data;
    } catch (error) {
        console.error('Error fetching profile by name:', error);
        return null;
    }
}

async function loadProfile() {
    const profileName = document.getElementById('profileName').value;
    const profileData = await getProfileByName(profileName);
    if (profileData) {
        // Populate form fields
        for (const key in profileData) {
            if (profileData.hasOwnProperty(key)) {
                const input = document.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = profileData[key];
                }
            }
        }

        // Populate images
        for (const imageId in profileData.images) {
            if (profileData.images.hasOwnProperty(imageId)) {
                const img = document.getElementById(imageId.replace('Upload', 'Image'));
                if (img) {
                    img.src = profileData.images[imageId];
                    img.style.display = 'block';
                }
            }
        }

        // Populate total weight lifted
        document.getElementById('totalWeight').textContent = profileData.totalweight;

        // Ensure specific fields are populated if not found dynamically
        document.getElementById('armMeasurement').value = profileData.armmeasurement || '';
        document.getElementById('calfMeasurement').value = profileData.calfmeasurement || '';
        document.getElementById('thighMeasurement').value = profileData.thighmeasurement || '';
        document.getElementById('buttMeasurement').value = profileData.buttmeasurement || '';


        // Populate goal measurements
        document.getElementById('goalArmMeasurement').value = profileData.goalarmmeasurement || '';
        document.getElementById('goalCalfMeasurement').value = profileData.goalcalfmeasurement || '';
        document.getElementById('goalThighMeasurement').value = profileData.goalthighmeasurement || '';
        document.getElementById('goalButtMeasurement').value = profileData.goalbuttmeasurement || '';

        // Load workout and nutrition days
        currentWorkoutDay = profileData.currentworkoutday || 1;
        currentNutritionDay = profileData.currentnutritionday || 1;


        // Populate table
        const tbody = document.querySelector('#nutritionLog tbody');
        tbody.innerHTML = ''; // Clear existing rows
        profileData.nutritionlog.forEach(log => {
            const row = document.createElement('tr');
            row.dataset.day = log.day;
            row.innerHTML = `<td>Day ${log.day}</td><td>${log.water}</td><td>${log.calories}</td><td>${log.vitamins}</td><td>${log.sleep}</td>`;
            
            for (const workout in log.workouts) {
                const td = document.createElement('td');
                td.dataset.workout = workout;
                td.textContent = log.workouts[workout];
                row.appendChild(td);
            }

            tbody.appendChild(row);
        });
    } else {
        alert('Profile not found!');
    }
}

function saveCurrentDayState() {
    const profileData = JSON.parse(localStorage.getItem('profileData')) || {};
    profileData.currentworkoutday = currentWorkoutDay;
    profileData.currentnutritionday = currentNutritionDay;
    localStorage.setItem('profileData', JSON.stringify(profileData));

    // Update the profile in Supabase
    updateProfileDayState(profileData.name, currentWorkoutDay, currentNutritionDay);
}

async function updateProfileDayState(profileName, workoutDay, nutritionDay) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .update({ currentworkoutday: workoutDay, currentnutritionday: nutritionDay })
            .eq('name', profileName);
        if (error) throw error;
        console.log('Day state updated in Supabase:', data);
    } catch (error) {
        console.error('Error updating day state in Supabase:', error);
    }
}