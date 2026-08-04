#ifndef SYMPTOM_CHECKER_H
#define SYMPTOM_CHECKER_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

#define MAX_NAME_LENGTH 50
#define MAX_SYMPTOMS 150

typedef struct Suggestion {
    char diseaseName[MAX_NAME_LENGTH];
    double likelihoodScore;
} Suggestion_t;

typedef struct DiseaseNode {
    char name[MAX_NAME_LENGTH];
    double likelihoodWeight;
    struct DiseaseNode* next;
} DiseaseNode_t;

typedef struct SymptomEntry {
    char name[MAX_NAME_LENGTH];
    DiseaseNode_t* head;
} SymptomEntry_t;

typedef struct SymptomChecker {
    SymptomEntry_t entries[MAX_SYMPTOMS];
    int symptomCount;
} SymptomChecker_t;

void initializeChecker(SymptomChecker_t* checker);
void addAssociation(SymptomChecker_t* checker, const char* symptom, const char* disease, double weight);
Suggestion_t* checkSymptoms(SymptomChecker_t* checker, const char** inputSymptoms, int numInputs, int* resultCount);
/* Returns 0 on success, -1 if the scratch buffer could not be
   allocated (in which case `arr` is left untouched). */
int mergeSort(Suggestion_t* arr, int size);
void freeChecker(SymptomChecker_t* checker);
void printMedication(const char* disease);

#endif
