#include "symptom_checker.h"

static int findSymptomIndex(SymptomChecker_t* checker, const char* symptom) {
    for (int i = 0; i < checker->symptomCount; i++) {
        if (strcmp(checker->entries[i].name, symptom) == 0) {
            return i;
        }
    }
    return -1;
}

static void merge(Suggestion_t* arr, int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;

    Suggestion_t* L = malloc(n1 * sizeof(Suggestion_t));
    Suggestion_t* R = malloc(n2 * sizeof(Suggestion_t));

    if (L == NULL || R == NULL) {
        if (L) free(L);
        if (R) free(R);
        return;
    }

    for (int i = 0; i < n1; i++)
        L[i] = arr[left + i];
    for (int j = 0; j < n2; j++)
        R[j] = arr[mid + 1 + j];

    int i = 0, j = 0, k = left;

    while (i < n1 && j < n2) {
        if (L[i].likelihoodScore >= R[j].likelihoodScore) {
            arr[k++] = L[i++];
        } else {
            arr[k++] = R[j++];
        }
    }

    while (i < n1)
        arr[k++] = L[i++];
    while (j < n2)
        arr[k++] = R[j++];

    free(L);
    free(R);
}

static void mergeSortRecursive(Suggestion_t* arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSortRecursive(arr, left, mid);
        mergeSortRecursive(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

void mergeSort(Suggestion_t* arr, int size) {
    mergeSortRecursive(arr, 0, size - 1);
}

void initializeChecker(SymptomChecker_t* checker) {
    checker->symptomCount = 0;
    for (int i = 0; i < MAX_SYMPTOMS; i++) {
        checker->entries[i].head = NULL;
        checker->entries[i].name[0] = '\0';
    }
}

void addAssociation(SymptomChecker_t* checker, const char* symptom, const char* disease, double weight) {
    int index = findSymptomIndex(checker, symptom);

    if (index == -1) {
        index = checker->symptomCount++;
        strncpy(checker->entries[index].name, symptom, MAX_NAME_LENGTH - 1);
        checker->entries[index].name[MAX_NAME_LENGTH - 1] = '\0';
    }

    DiseaseNode_t* newNode = malloc(sizeof(DiseaseNode_t));
    if (newNode == NULL) return;

    strncpy(newNode->name, disease, MAX_NAME_LENGTH - 1);
    newNode->name[MAX_NAME_LENGTH - 1] = '\0';
    newNode->likelihoodWeight = weight;
    newNode->next = checker->entries[index].head;
    checker->entries[index].head = newNode;
}

Suggestion_t* checkSymptoms(SymptomChecker_t* checker, const char** inputSymptoms, int numInputs, int* resultCount) {
    int maxTempResults = MAX_SYMPTOMS * 5;
    Suggestion_t* tempResults = malloc(maxTempResults * sizeof(Suggestion_t));
    int tempCount = 0;

    if (tempResults == NULL) {
        *resultCount = 0;
        return NULL;
    }

    for (int i = 0; i < numInputs; i++) {
        int idx = findSymptomIndex(checker, inputSymptoms[i]);

        if (idx != -1) {
            DiseaseNode_t* current = checker->entries[idx].head;
            while (current != NULL) {
                bool found = false;
                for (int k = 0; k < tempCount; k++) {
                    if (strcmp(tempResults[k].diseaseName, current->name) == 0) {
                        tempResults[k].likelihoodScore += current->likelihoodWeight;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    strncpy(tempResults[tempCount].diseaseName, current->name, MAX_NAME_LENGTH - 1);
                    tempResults[tempCount].diseaseName[MAX_NAME_LENGTH - 1] = '\0';
                    tempResults[tempCount].likelihoodScore = current->likelihoodWeight;
                    tempCount++;
                }
                current = current->next;
            }
        }
    }

    mergeSort(tempResults, tempCount);

    Suggestion_t* finalResults = malloc(tempCount * sizeof(Suggestion_t));
    memcpy(finalResults, tempResults, tempCount * sizeof(Suggestion_t));
    free(tempResults);

    *resultCount = tempCount;
    return finalResults;
}

void freeChecker(SymptomChecker_t* checker) {
    for (int i = 0; i < checker->symptomCount; i++) {
        DiseaseNode_t* current = checker->entries[i].head;
        while (current != NULL) {
            DiseaseNode_t* next = current->next;
            free(current);
            current = next;
        }
        checker->entries[i].head = NULL;
    }
    checker->symptomCount = 0;
}

void printMedication(const char* disease) {
    if (strcmp(disease, "Flu") == 0) printf("- Rest, hydration, paracetamol.\n");
    else if (strcmp(disease, "Common Cold") == 0) printf("- Steam inhalation, antihistamines.\n");
    else if (strcmp(disease, "Allergy") == 0) printf("- Cetirizine or similar antihistamine.\n");
    else if (strcmp(disease, "Migraine") == 0) printf("- Ibuprofen and rest.\n");
    else if (strcmp(disease, "Sinusitis") == 0) printf("- Steam and nasal decongestants.\n");
    else if (strcmp(disease, "COVID-19") == 0) printf("- Isolation, hydration, paracetamol.\n");
    else if (strcmp(disease, "Malaria") == 0) printf("- Start antimalarial medication.\n");
    else if (strcmp(disease, "Dengue") == 0) printf("- Hydration, avoid NSAIDs.\n");
    else if (strcmp(disease, "Typhoid") == 0) printf("- Complete antibiotic course.\n");
    else if (strcmp(disease, "Asthma") == 0) printf("- Use inhaler immediately.\n");
    else if (strcmp(disease, "Pneumonia") == 0) printf("- Seek medical care, antibiotics.\n");
    else if (strcmp(disease, "Food Poisoning") == 0) printf("- ORS and fluids.\n");
    else if (strcmp(disease, "Acid Reflux") == 0) printf("- Antacids and avoid spicy food.\n");
    else if (strcmp(disease, "Bronchitis") == 0) printf("- Cough syrup and warm fluids.\n");
    else if (strcmp(disease, "Dehydration") == 0) printf("- ORS and plenty of fluids.\n");
    else if (strcmp(disease, "Heat Stroke") == 0) printf("- Move to cool place, drink water.\n");
    else if (strcmp(disease, "Anxiety Attack") == 0) printf("- Deep breathing exercises.\n");
    else if (strcmp(disease, "Stomach Ulcer") == 0) printf("- Antacids and avoid caffeine.\n");
    else printf("- No medication data available.\n");
}
