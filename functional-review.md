# Session Flow

**NOTE:** Actual response shapes are always of the form:

```json
{
  "success": true,
  "message": "Server message",
  "data": {}
}
```

Only the data object is considered in this document.

## Create session ( `POST /sessions` )

### Correct Request/Response shape

**`POST /sessions`** request:

```json
{
  "topicId": "S108",
  "mode": "quick"
}
```

**`POST /sessions`** response:

```json
{
  "sessionId": "uuid",
  "mode": "quick",
  "totalTopicsToProbe": 7,
  "currentTopic": {
    "id": "S108",
    "title": "Simultaneous Linear Equations"
  },
  "question": {
    "id": "uuid",
    "text": "Solve for x and y: 2x + y = 7, x − y = 2",
    "type": "multiple_choice",
    "options": ["A. x=2, y=3", "B. x=3, y=1", "C. x=1, y=5", "D. x=4, y=−1"]
  }
}
```

### Current Request/Response shape

Matches with correct shape

### Correct behaviour

- Fetch dependency graph and build probe order
- Cache direct_dependencies for all nodes in probe order
- Generate questions for all topics
- Persist questions to database (potential issue: how are just-generated questions for the next probe fetched if many questions for a topic exist)
- Initialise session state(all topics untested)
- Persist test session to database
- Return first question to client

### Current Behaviour

Matches with correct behaviour

## Get Session ( `GET /sessions/:id` )

### Correct Request/Response shape

#### Response

```json
{
  "id": "uuid",
  "status": "in_progress",
  "progress": {
    "answeredCount": 2,
    "totalPlanned": 4
  }
}
```

### Current Request/Response shape

Matches correct shape

### Correct Behaviour

- Fetch session by id
- De-serialize session state
- Compute `answersCount` from `topicStates`
- Return session data

### Current Behaviour

Matches correct behaviour

## Submit Answer ( `POST /sessions/:id/answer` )

### Correct Request/Response shape

#### Request

```json
{
  "questionId": "uuid",
  "answer": "B"
}
```

#### Response

```json
{
  "progress": { "topicsProbed": 2, "totalTopicsToProbe": 7 },
  "currentTopic": { "id": "S106", "title": "Simple Linear Equations" },
  "question": {
    "id": "uuid",
    "text": "...",
    "type": "multiple_choice",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."]
  },
  "previousAnswer": {
    "wasCorrect": true,
    "explanation": "..."
  }
}
```

### Current Request/Response shape

Currently, the session sends a 500 Service failure with no message . The following is the contract the service tries to fulfill for this endpoint, although it deviates from the correct contract.

#### Response

```json
{
  "type": "question",
  "progress": { "topicsProbed": 2, "totalTopicsToProbe": 7 },
  "currentTopic": { "id": "S106", "title": "Simple Linear Equations" },
  "question": {
    "id": "uuid",
    "text": "...",
    "type": "multiple_choice",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."]
  },
  "previousAnswer": {
    "wasCorrect": true,
    "explanation": "..."
  }
}
```

In cases where `sessionState.completed` is `true`.
Then the response has this shape:

```json
{
  "type": "complete",
  "weaknessMap": {
    "gaps": [
      { "id": "S108", "title": "Simultaneous Linear Equations", "score": 0.33 },
      { "id": "S106", "title": "Simple Linear Equations", "score": 0.67 }
    ],
    "proficient": [
      {
        "id": "S105",
        "title": "Algebraic Expressions & Factorisation",
        "score": 1.0
      }
    ]
  }
}
```

Instead of having an endpoint fulfill two different contracts, test completion behaviour should be on a different endpoint.

### Correct Behaviour

Assuming `env.QUESTIONS_PER_PROBE = 3`

1. Load session
2. If session not in progress, send bad request response
3. If last probe and , 2 questions answered return error response and direct to submit endpoint
4. Deserialise session_state
5. Identify current topic and current question
6. Evaluate answer (letter comparison)
7. Write to test_response
8. Update topicState.answers

9. If probe complete (3 answers recorded):
   Compute score = correct / 3
   Mark topic as gap or proficient
   Update weaknessMap

   Call advanceProbe()
   If next topic exists:
   Set currentProbeIndex, reset currentQuestionIndex to 0
   Load pendingQuestions for next topic (already generated at session start)

10. Else:
    Increment currentQuestionIndex

11. Persist session_state
12. Return next questiones

### Current Behaviour

Currently, the session sends a 500 Service failure with no message. The following is the behaviour the service tries to implement, although it deviates from the correct behaviour.

1. Load session
2. Send failure response if session not in progress
3. Serialize sessionState
4. Fetch current question
5. Compare user answer to question.correct_answer(direct string comparison)
6. set topicState status to "probing" if less than 3 questions have been answered
7. Push current question to current topicState.questionsAsked
8. Push answer to current topicState.answers
9. Send Internal server error with no message if topicState.score is not a number
10. Add 1/3 to topicState.score if the answer is correct
11. Update currentProbeIndex and currentQuestionIndex
12. Set session state to complete if probes are exhausted
13. Update session with new session state
14. Send success response if sessionState.completed is true
15. Fetch next question (issue: uses sessionStae.pendingquestions even though it hasn't been updated if the probe has changed)
16. Send Not found response if question can't be found
17. Send success response with new question

## Get Results ( `GET /sessions/:id/results` )

### Correct Request/Response Shape

#### Response

```json
{
  "sessionId": "uuid",
  "mode": "quick",
  "entryTopic": { "id": "S108", "title": "Simultaneous Linear Equations" },
  "weaknessMap": {
    "gaps": [
      { "id": "S108", "title": "Simultaneous Linear Equations", "score": 0.33 },
      { "id": "S106", "title": "Simple Linear Equations", "score": 0.67 }
    ],
    "proficient": [
      {
        "id": "S105",
        "title": "Algebraic Expressions & Factorisation",
        "score": 1.0
      }
    ]
  },
  "completedAt": "2025-04-23T10:00:00Z"
}
```

### Current Request/Response Shape

```json
{
  "sessionId": "uuid",
  "mode": "quick",
  "entryTopicId": "uuid",
  "scoreByTopicId": {
    "topicId": 0.88,
    "topicId": 0.99
  }
}
```

### Correct Behaviour

1. Fetch Session
2. Deserialize session state
3. Return session data with weakness map

### Current Behaviour

1. Fetch Session
2. Deserialize session state
3. Return session data with score by topic

## Abandon ( `POST /sessions/:id/abandon` )

### Correct Request/Response Shape

#### Request

No request body

#### Response

```json
{
  "id": "uuid",
  "status": "abandoned"
}
```

### Current Request/Response Shape

Matches with correct shape

### Correct Behaviour

1. Fetch session
2. Update status to abandoned

### Current Behaviour

Matches correct behaviour

## Submit session ( `POST /sessions/:id/submit` )

yet to be implemented

### Correct Request/Response Shape

#### Request

```json
{
  "questionId": "uuid",
  "answer": "B"
}
```

#### Response

```json
{
  "type": "complete",
  "weaknessMap": {
    "gaps": ["S108", "S106"],
    "proficient": ["S105"],
    "untested": ["F03"]
  }
}
```

### Correct Behaviour

Assuming `env.QUESTIONS_PER_PROBE = 3`

1. Load session
2. If session not in progress, send bad request response
3. If not last probe and last question return error response and direct to answer endpoint
4. Deserialise session_state
5. Identify current topic and current question
6. Evaluate answer (letter comparison)
7. Write to test_response
8. Update topicState.answers
9. Compute score, Mark topic as gap or proficient, update weaknessMap,
10. Finalise session
11. Persist session_state
12. Return session state and weakness map

## Blockers to session

- AI failure
- /answer endpoint not working
- Unreliable answer correctness comparison
- Scores aren't calculated properly (with degradation and recency bias)
- No clarity with question reuse
- Can't currently retrieve just-generated questions
- AI latency
-
