#include "symptom_checker.h"

#define HISTORY_SIZE 5
#define MAX_INPUT_SYMPTOMS 10
#define BUFFER_SIZE 50

char history[HISTORY_SIZE][MAX_NAME_LENGTH];
int historyCount = 0;

void addToHistory(const char* result) {
    if (historyCount < HISTORY_SIZE) {
        strncpy(history[historyCount], result, MAX_NAME_LENGTH - 1);
        history[historyCount][MAX_NAME_LENGTH - 1] = '\0';
        historyCount++;
    } else {
        for (int i = 0; i < HISTORY_SIZE - 1; i++)
            strcpy(history[i], history[i + 1]);
        strncpy(history[HISTORY_SIZE - 1], result, MAX_NAME_LENGTH - 1);
        history[HISTORY_SIZE - 1][MAX_NAME_LENGTH - 1] = '\0';
    }
}

static void displayAvailableSymptoms(SymptomChecker_t* checker) {
    printf("\nAvailable Symptoms:\n");
    for (int i = 0; i < checker->symptomCount; i++)
        printf("- %s\n", checker->entries[i].name);
    printf("\n");
}

static char** getUserInput(int* count) {
    char buffer[BUFFER_SIZE];
    char** symptoms = malloc(MAX_INPUT_SYMPTOMS * sizeof(char*));
    int currentCount = 0;

    if (symptoms == NULL) {
        fprintf(stderr, "error: out of memory reading symptoms\n");
        *count = 0;
        return NULL;
    }

    printf("\n(Type 'done' or empty line to finish)\n");

    while (currentCount < MAX_INPUT_SYMPTOMS) {
        printf("Symptom %d: ", currentCount + 1);
        if (fgets(buffer, BUFFER_SIZE, stdin) == NULL) break;

        size_t len = strlen(buffer);
        if (len > 0 && buffer[len - 1] == '\n') buffer[len - 1] = '\0';

        if (strlen(buffer) == 0 || strcmp(buffer, "done") == 0) break;

        symptoms[currentCount] = malloc(MAX_NAME_LENGTH);
        if (symptoms[currentCount] == NULL) {
            fprintf(stderr, "error: out of memory - keeping the %d symptom(s) read so far\n",
                    currentCount);
            break;
        }
        strncpy(symptoms[currentCount], buffer, MAX_NAME_LENGTH - 1);
        symptoms[currentCount][MAX_NAME_LENGTH - 1] = '\0';
        currentCount++;
    }

    *count = currentCount;
    return symptoms;
}

static void freeSymptomList(char** list, int count) {
    /* getUserInput() now returns NULL if the array allocation failed. */
    if (list == NULL) return;
    for (int i = 0; i < count; i++)
        free(list[i]);
    free(list);
}

int main() {
    SymptomChecker_t checker;
    initializeChecker(&checker);
    /* Initialised: if the first scanf() below fails (EOF, closed stdin,
       piped input), an uninitialised `choice` made the do/while condition
       read an indeterminate value. */
    char choice = 'n';

    printf("--- INTERACTIVE DISEASE SYMPTOM CHECKER ---\n");

    addAssociation(&checker, "Headache", "Flu", 0.8);
    addAssociation(&checker, "Headache", "Common Cold", 0.5);
    addAssociation(&checker, "Headache", "Migraine", 0.95);

    addAssociation(&checker, "Fever", "Flu", 0.9);
    addAssociation(&checker, "Fever", "Common Cold", 0.6);
    addAssociation(&checker, "Fever", "COVID-19", 0.85);
    addAssociation(&checker, "Fever", "Malaria", 0.9);
    addAssociation(&checker, "Fever", "Dengue", 0.92);

    addAssociation(&checker, "Cough", "Flu", 0.75);
    addAssociation(&checker, "Cough", "Common Cold", 0.7);
    addAssociation(&checker, "Cough", "Bronchitis", 0.9);
    addAssociation(&checker, "Cough", "Pneumonia", 0.85);

    addAssociation(&checker, "Sneezing", "Allergy", 0.95);
    addAssociation(&checker, "Sneezing", "Common Cold", 0.65);

    addAssociation(&checker, "Runny Nose", "Allergy", 0.7);
    addAssociation(&checker, "Runny Nose", "Common Cold", 0.65);

    addAssociation(&checker, "Fatigue", "Flu", 0.85);
    addAssociation(&checker, "Fatigue", "Dengue", 0.75);
    addAssociation(&checker, "Fatigue", "Typhoid", 0.8);

    addAssociation(&checker, "Nausea", "Food Poisoning", 0.9);
    addAssociation(&checker, "Nausea", "Migraine", 0.7);
    addAssociation(&checker, "Nausea", "Stomach Ulcer", 0.8);

    addAssociation(&checker, "Vomiting", "Food Poisoning", 0.95);
    addAssociation(&checker, "Vomiting", "Dengue", 0.6);

    addAssociation(&checker, "Chest Pain", "Asthma", 0.8);
    addAssociation(&checker, "Chest Pain", "Pneumonia", 0.85);

    addAssociation(&checker, "Shortness of Breath", "Asthma", 0.9);
    addAssociation(&checker, "Shortness of Breath", "COVID-19", 0.8);

    addAssociation(&checker, "Body Pain", "Dengue", 0.88);
    addAssociation(&checker, "Body Pain", "Flu", 0.6);

    addAssociation(&checker, "Diarrhea", "Food Poisoning", 0.9);
    addAssociation(&checker, "Diarrhea", "Typhoid", 0.75);

    addAssociation(&checker, "Burning Chest", "Acid Reflux", 0.9);

    addAssociation(&checker, "Wheezing", "Asthma", 0.92);

    addAssociation(&checker, "High Pulse", "Heat Stroke", 0.85);
    addAssociation(&checker, "High Pulse", "Anxiety Attack", 0.8);

    addAssociation(&checker, "Dry Throat", "Dehydration", 0.88);

    addAssociation(&checker, "Stomach Pain", "Stomach Ulcer", 0.85);
    addAssociation(&checker, "Stomach Pain", "Food Poisoning", 0.6);

    printf("Graph initialized with %d symptoms.\n", checker.symptomCount);

    do {
        displayAvailableSymptoms(&checker);
        int numInputSymptoms = 0;
        char** inputSymptoms = getUserInput(&numInputSymptoms);

        if (numInputSymptoms > 0) {
            int resultCount = 0;
            Suggestion_t* suggestions = checkSymptoms(&checker, (const char**)inputSymptoms, numInputSymptoms, &resultCount);

            if (suggestions && resultCount > 0) {
                char topResult[MAX_NAME_LENGTH];
                snprintf(topResult, MAX_NAME_LENGTH, "%s (%.2f)", suggestions[0].diseaseName, suggestions[0].likelihoodScore);
                addToHistory(topResult);

                printf("\nTop Condition: %s (Score: %.2f)\n", suggestions[0].diseaseName, suggestions[0].likelihoodScore);
                printMedication(suggestions[0].diseaseName);

                printf("\nAll Conditions:\n");
                for (int i = 0; i < resultCount; i++)
                    printf("%d. %s (%.2f)\n", i + 1, suggestions[i].diseaseName, suggestions[i].likelihoodScore);
            } else {
                printf("\nNo matching conditions for those symptoms.\n");
            }

            /* Free unconditionally: when resultCount is 0, checkSymptoms
               still returns the malloc(0) block, which the old
               `if (suggestions && resultCount > 0)` guard leaked. */
            free(suggestions);

            printf("\nHistory:\n");
            for (int i = historyCount - 1; i >= 0; i--)
                printf("- %s\n", history[i]);
        }

        /* getUserInput() always allocates the pointer array, even when the
           user enters nothing. Freeing it only inside the
           `numInputSymptoms > 0` branch leaked that array on every
           iteration where the user typed 'done' or a blank line straight
           away. */
        freeSymptomList(inputSymptoms, numInputSymptoms);

        printf("\nAnother check? (y/n): ");
        if (scanf(" %c", &choice) != 1) {
            /* EOF or a read error - stop instead of spinning. */
            choice = 'n';
            break;
        }

        /* Drain the rest of the line. The old `while (getchar() != '\n');`
           looped forever once stdin hit EOF, because getchar() then returns
           EOF on every call and never '\n' - so piping input or pressing
           Ctrl-D hung the program. */
        int ch;
        while ((ch = getchar()) != '\n' && ch != EOF) {
            /* discard */
        }

    } while (choice == 'y' || choice == 'Y');

    freeChecker(&checker);
    return 0;
}
