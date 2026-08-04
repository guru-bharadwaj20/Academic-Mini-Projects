#include "symptom_checker.h"

static int findSymptomIndex(SymptomChecker_t* checker, const char* symptom) {
    for (int i = 0; i < checker->symptomCount; i++) {
        if (strcmp(checker->entries[i].name, symptom) == 0) {
            return i;
        }
    }
    return -1;
}

/* Merge using a caller-supplied scratch buffer.
 *
 * This used to malloc two temporary halves on EVERY merge, and on failure
 * it simply returned - leaving that range unsorted while the caller went on
 * believing the sort had succeeded, so the "ranked" output was silently
 * wrong. One scratch buffer allocated once in mergeSort() removes the
 * failure mode from the recursion entirely (and turns O(n log n)
 * allocations into a single one). */
static void merge(Suggestion_t* arr, Suggestion_t* scratch, int left, int mid, int right) {
    for (int i = left; i <= right; i++)
        scratch[i] = arr[i];

    int i = left, j = mid + 1, k = left;

    while (i <= mid && j <= right) {
        if (scratch[i].likelihoodScore >= scratch[j].likelihoodScore) {
            arr[k++] = scratch[i++];
        } else {
            arr[k++] = scratch[j++];
        }
    }

    while (i <= mid)
        arr[k++] = scratch[i++];
    while (j <= right)
        arr[k++] = scratch[j++];
}

static void mergeSortRecursive(Suggestion_t* arr, Suggestion_t* scratch, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSortRecursive(arr, scratch, left, mid);
        mergeSortRecursive(arr, scratch, mid + 1, right);
        merge(arr, scratch, left, mid, right);
    }
}

int mergeSort(Suggestion_t* arr, int size) {
    if (size < 2) return 0;

    Suggestion_t* scratch = malloc((size_t)size * sizeof(Suggestion_t));
    if (scratch == NULL) return -1;

    mergeSortRecursive(arr, scratch, 0, size - 1);
    free(scratch);
    return 0;
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
        /* entries[] is a fixed MAX_SYMPTOMS array. Without this check the
           151st distinct symptom wrote past the end of the struct. */
        if (checker->symptomCount >= MAX_SYMPTOMS) {
            fprintf(stderr,
                    "error: symptom table full (%d max) - dropping '%s'\n",
                    MAX_SYMPTOMS, symptom);
            return;
        }
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
                    /* tempResults holds at most maxTempResults entries;
                       appending without checking would run off the end once
                       the dataset carried more distinct diseases than that. */
                    if (tempCount >= maxTempResults) {
                        fprintf(stderr,
                                "warning: result buffer full (%d) - some conditions omitted\n",
                                maxTempResults);
                        break;
                    }
                    strncpy(tempResults[tempCount].diseaseName, current->name, MAX_NAME_LENGTH - 1);
                    tempResults[tempCount].diseaseName[MAX_NAME_LENGTH - 1] = '\0';
                    tempResults[tempCount].likelihoodScore = current->likelihoodWeight;
                    tempCount++;
                }
                current = current->next;
            }
        }
    }

    if (mergeSort(tempResults, tempCount) != 0) {
        /* Previously the failure was swallowed and a partially sorted list
           was returned as if it were correctly ranked. */
        fprintf(stderr, "error: could not sort results (out of memory)\n");
        free(tempResults);
        *resultCount = 0;
        return NULL;
    }

    /* Nothing matched. Returning the malloc(0) block here meant callers had
       to remember to free a pointer to zero bytes, and memcpy() onto a
       possibly-NULL destination is undefined even for a zero length. */
    if (tempCount == 0) {
        free(tempResults);
        *resultCount = 0;
        return NULL;
    }

    Suggestion_t* finalResults = malloc((size_t)tempCount * sizeof(Suggestion_t));
    if (finalResults == NULL) {
        /* Previously unchecked: memcpy() straight onto a NULL destination. */
        free(tempResults);
        *resultCount = 0;
        return NULL;
    }
    memcpy(finalResults, tempResults, (size_t)tempCount * sizeof(Suggestion_t));
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
