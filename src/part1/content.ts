//Content & Assessment banks for the COS212 BFS Tutor
//For AI Log: Used claude to generate questions and answers to create single and multi-attribute questions

import type { QuizItem } from "../shared/types";
import { SKILL_ORDER } from "../shared/types";
//for questions requiring graphs
import {
  adjacencyListText,
  graphA2Diag,
  graphA4Diag,
  graphA5Diag1,
  graphA5Diag2,
  graphA5Diag3,
  graphA6Diag1,
  graphA2Recheck,
  graphA4Recheck,
  graphA5Recheck1,
  graphA5Recheck2,
  graphA5Recheck3,
  graphA6Recheck1,
} from "./graphs";

export { SKILL_ORDER };
export { adjacencyListText };

//Diagnostic bank, 13 items
export const diagnosticItems: QuizItem[] = [
  {
    id: "d-A1-1",
    bank: "diagnostic",
    requires: ["A1"],
    mastery: "remember",
    prompt:
      "In graph terminology, what is a single point in a graph (the thing that a line connects to) called?",
    options: [
      { id: "a", text: "A vertex (also called a node)", feedback: "Correct. A vertex (node) is a point; an edge is the line joining two of them." },
      { id: "b", text: "An edge of the graph", feedback: "An edge is the LINE joining two points, not the point itself." },
      { id: "c", text: "A queue of items", feedback: "A queue is a data structure BFS uses; it is not a part of a graph." },
      { id: "d", text: "A path through it", feedback: "A path is a sequence of edges between vertices, not a single point." },
    ],
    correctOptionId: "a",
  },
  {
    id: "d-A1-2",
    bank: "diagnostic",
    requires: ["A1"],
    mastery: "remember",
    prompt:
      "An edge is drawn with an arrow from X to Y. In a DIRECTED graph, what does that arrow tell you about travelling between X and Y?",
    options: [
      { id: "a", text: "You can only travel from X to Y, not back from Y to X", feedback: "Correct. In a directed graph the arrow allows travel in one direction only." },
      { id: "b", text: "You may travel freely in both directions", feedback: "That describes an UNDIRECTED edge; a directed arrow is one-way." },
      { id: "c", text: "X and Y must have the same label", feedback: "An arrow is about direction of travel, not about labels." },
      { id: "d", text: "The edge connects three vertices at once", feedback: "An edge joins exactly two vertices, whether directed or not." },
    ],
    correctOptionId: "a",
  },
  {
    id: "d-A2-1",
    bank: "diagnostic",
    requires: ["A2"],
    mastery: "understand",
    prompt:
      "Look at the undirected graph (adjacency list given alongside). Which vertices are the neighbours of C?",
    graph: graphA2Diag,
    adjacencyText: adjacencyListText(graphA2Diag),
    options: [
      { id: "a", text: "A and B only", feedback: "You missed D — C is also joined to D by an edge." },
      { id: "b", text: "B and D only", feedback: "You missed A — the edge A–C makes A a neighbour of C too." },
      { id: "c", text: "A, B and D", feedback: "Correct. C is joined by edges to A, B and D." },
      { id: "d", text: "D on its own", feedback: "C has three neighbours (A, B, D), not just one." },
    ],
    correctOptionId: "c",
  },
  {
    id: "d-A2-2",
    bank: "diagnostic",
    requires: ["A2"],
    mastery: "understand",
    prompt:
      "In the same undirected graph (adjacency list alongside), how many neighbours does vertex A have?",
    graph: graphA2Diag,
    adjacencyText: adjacencyListText(graphA2Diag),
    options: [
      { id: "a", text: "Three neighbours", feedback: "A has only two edges (to B and to C), so two neighbours." },
      { id: "b", text: "Zero neighbours", feedback: "A is connected — it has edges to B and C." },
      { id: "c", text: "One neighbour", feedback: "Count both of A's edges: A–B and A–C give two neighbours." },
      { id: "d", text: "Two neighbours", feedback: "Correct. A's edges go to B and C, so two neighbours." },
    ],
    correctOptionId: "d",
  },
  {
    id: "d-A3-1",
    bank: "diagnostic",
    requires: ["A3"],
    mastery: "understand",
    prompt:
      "A queue is 'first in, first out'. You enqueue P, then Q, then R. Which item comes out first when you dequeue?",
    options: [
      { id: "a", text: "R, the last one added", feedback: "That is STACK (LIFO) behaviour. A queue removes the OLDEST item first." },
      { id: "b", text: "Q, the middle one", feedback: "A queue does not start in the middle; it removes from the front (oldest)." },
      { id: "c", text: "P, the first one added", feedback: "Correct. FIFO: the first item enqueued is the first dequeued." },
      { id: "d", text: "All of them at once", feedback: "A dequeue removes exactly one item — the one at the front." },
    ],
    correctOptionId: "c",
  },
  {
    id: "d-A3-2",
    bank: "diagnostic",
    requires: ["A3"],
    mastery: "understand",
    prompt:
      "A queue currently holds [X, Y, Z] (X is at the front). You dequeue one item, then enqueue W. What does the queue hold now (front first)?",
    options: [
      { id: "a", text: "[Y, Z, W]", feedback: "Correct. Dequeue removes front X -> [Y, Z]; enqueue adds W at the back." },
      { id: "b", text: "[W, X, Y]", feedback: "New items join the BACK, not the front, and X was removed." },
      { id: "c", text: "[X, Y, Z, W]", feedback: "You forgot the dequeue: the front item X must be removed first." },
      { id: "d", text: "[Z, Y, W]", feedback: "A queue keeps its order; it does not reverse to [Z, Y]." },
    ],
    // Dequeue removes X (front) -> [Y, Z]; enqueue W at back -> [Y, Z, W].
    correctOptionId: "a",
  },
  {
    id: "d-A4-1",
    bank: "diagnostic",
    requires: ["A3", "A4"],
    mastery: "understand",
    prompt:
      "BFS keeps the vertices it still has to process in a QUEUE. Using the graph alongside: after you dequeue a vertex from the front and visit it, what do you do next so the queue drives the search correctly?",
    graph: graphA4Diag,
    adjacencyText: adjacencyListText(graphA4Diag),
    options: [
      { id: "a", text: "Push this vertex onto the FRONT so it is processed again next", feedback: "That re-processes the same vertex forever; BFS moves on to its neighbours." },
      { id: "b", text: "Enqueue its undiscovered neighbours at the BACK, marking them on enqueue", feedback: "Correct. New neighbours join the back and are marked as they are discovered, so none is enqueued twice." },
      { id: "c", text: "Empty the whole queue and restart from this vertex", feedback: "Clearing the queue discards vertices still waiting — BFS would never finish." },
      { id: "d", text: "Enqueue the neighbours of its neighbours before its own", feedback: "Skipping a level is depth-first-ish; BFS must enqueue THIS vertex's own neighbours first." },
    ],
    correctOptionId: "b",
  },
  {
    id: "d-A4-2",
    bank: "diagnostic",
    requires: ["A3", "A4"],
    mastery: "understand",
    prompt:
      "In the BFS procedure (trace it on the graph alongside), we mark a vertex visited the moment it is ENQUEUED (first discovered), not when it is later dequeued. Why?",
    graph: graphA4Diag,
    adjacencyText: adjacencyListText(graphA4Diag),
    options: [
      { id: "a", text: "So the vertex changes colour on the screen as it is drawn", feedback: "Misconception: marking is bookkeeping (it prevents re-enqueue), not a display effect." },
      { id: "b", text: "Because the queue may only ever hold vertices already visited", feedback: "Backwards: the queue holds vertices WAITING to be processed, not finished ones." },
      { id: "c", text: "So a vertex is never enqueued twice and processed more than once", feedback: "Correct. Mark-on-DEQUEUE would let a vertex be queued via two neighbours before it is ever marked; marking on enqueue prevents the duplicate." },
      { id: "d", text: "Because the moment you mark a vertex makes no difference at all", feedback: "It does matter: mark-on-dequeue permits duplicate enqueues of the same vertex." },
    ],
    correctOptionId: "c",
  },

  {
    id: "d-A5-1",
    bank: "diagnostic",
    requires: ["A2", "A5"],
    mastery: "apply",
    prompt:
      "Trace BFS on the undirected graph starting at vertex 1. Follow this exact recipe: enqueue the start; repeatedly take the vertex at the FRONT of the queue, then add each of its not-yet-seen neighbours to the BACK of the queue; when a vertex has several new neighbours, add them in increasing numeric order. What is the order the vertices are visited?",
    graph: graphA5Diag1,
    adjacencyText: adjacencyListText(graphA5Diag1),
    options: [
      { id: "a", text: "1, 2, 3, 4", feedback: "Correct. Queue from 1 is [2,3]; take 2 (add 4) -> [3,4]; take 3; take 4." },
      { id: "b", text: "1, 2, 4, 3", feedback: "That takes the newest neighbour 4 before 3 — LIFO/stack order, not a FIFO queue." },
      { id: "c", text: "1, 4, 3, 2", feedback: "4 is not a neighbour of 1, so it cannot be visited second." },
      { id: "d", text: "1, 3, 2, 4", feedback: "With numeric tie-break, 2 is added to the queue before 3, so 2 is visited first." },
    ],
    correctOptionId: "a",
  },
  {
    id: "d-A5-2",
    bank: "diagnostic",
    requires: ["A2", "A3", "A4", "A5"],
    mastery: "apply",
    prompt:
      "Trace BFS on the undirected graph starting at A. (When a vertex has several new neighbours, take them in alphabetical order.) What is the visit order?",
    graph: graphA5Diag2,
    adjacencyText: adjacencyListText(graphA5Diag2),
    options: [
      { id: "a", text: "A, B, D, C, E", feedback: "This dives from B straight to its child D before C — depth-first, not BFS's FIFO queue." },
      { id: "b", text: "A, C, B, E, D", feedback: "Alphabetical tie-break visits B before C, so B must come before C." },
      { id: "c", text: "A, B, C, D, E", feedback: "Correct. Queue [B,C]; take B (add D) -> [C,D]; take C (add E) -> [D,E]; take D; take E." },
      { id: "d", text: "A, B, C, E, D", feedback: "D enters the queue (from B) before E (from C), so D is visited before E." },
    ],
    correctOptionId: "c",
  },
  {
    id: "d-A5-3",
    bank: "diagnostic",
    requires: ["A2", "A3", "A4", "A5"],
    mastery: "apply",
    prompt:
      "Trace BFS on the DIRECTED graph starting at R (follow the arrows; you may only travel in the arrow's direction). When a vertex has several new out-neighbours, take them in alphabetical order. What is the visit order?",
    graph: graphA5Diag3,
    adjacencyText: adjacencyListText(graphA5Diag3),
    options: [
      { id: "a", text: "R, N, M, T", feedback: "Alphabetical tie-break puts M in the queue before N, so M is visited before N." },
      { id: "b", text: "R, M, N, T", feedback: "Correct. Queue [M,N]; take M (no out-neighbours); take N (add T); take T." },
      { id: "c", text: "R, T, M, N", feedback: "T is not a direct out-neighbour of R, so it cannot be visited second." },
      { id: "d", text: "R, N, T, M", feedback: "This dives from N to its child T before R's other neighbour M — depth-first, not a FIFO queue." },
    ],
    correctOptionId: "b",
  },

  {
    id: "d-A6-1",
    bank: "diagnostic",
    requires: ["A4", "A5", "A6"],
    mastery: "apply",
    prompt:
      "BFS explored level by level finds the path with the FEWEST edges from the start. There is NO direct A–D edge here, so trace BFS from A on this undirected graph and use the level at which D is first reached: what is the fewest number of edges on a path from A to D?",
    graph: graphA6Diag1,
    adjacencyText: adjacencyListText(graphA6Diag1),
    options: [
      { id: "a", text: "3 edges (A–C–E–D)", feedback: "That is the LONGER decoy path; BFS finds a shorter 2-edge route first." },
      { id: "b", text: "1 edge (A–D)", feedback: "There is no direct A–D edge; D is not a neighbour of A." },
      { id: "c", text: "0 edges", feedback: "D is not the start, so it cannot be reached in zero edges." },
      { id: "d", text: "2 edges (A–B–D)", feedback: "Correct. BFS reaches D on level 2 via A–B–D; the A–C–E–D route is longer." },
    ],
    correctOptionId: "d",
  },
  {
    id: "d-A6-2",
    bank: "diagnostic",
    requires: ["A4", "A5", "A6"],
    mastery: "apply",
    prompt:
      "This undirected graph contains a cycle (A–B–D–E–C–A forms a loop of edges). When you trace BFS from A, why does the search still finish instead of going round the loop forever?",
    graph: graphA6Diag1,
    adjacencyText: adjacencyListText(graphA6Diag1),
    options: [
      { id: "a", text: "Because the queue holds at most four vertices", feedback: "Queue capacity is not the reason; marking visited vertices is what stops the loop." },
      { id: "b", text: "Because a graph with a cycle is not allowed as BFS input", feedback: "Misconception: BFS runs fine on cyclic graphs — that is exactly why marking matters." },
      { id: "c", text: "Because each vertex is marked once, so it is never enqueued again", feedback: "Correct. Marking on discovery means an already-seen vertex is skipped, so the cycle cannot be re-entered." },
      { id: "d", text: "Because BFS stops after a fixed number of steps", feedback: "BFS has no step limit; it ends because every vertex is marked and the queue empties." },
    ],
    correctOptionId: "c",
  },
];


//Re-check bank, targets the six skills with fresh questions.
//The journey only ASKS the subset for a student's gap skills; the full bank lives here.
export const recheckItems: QuizItem[] = [
  {
    id: "r-A1-1",
    bank: "recheck",
    requires: ["A1"],
    mastery: "remember",
    prompt:
      "What is the name for the connection (the line) drawn between two vertices in a graph?",
    options: [
      { id: "a", text: "A vertex of the graph", feedback: "A vertex is a point; the LINE joining two points is the edge." },
      { id: "b", text: "An edge of the graph", feedback: "Correct. An edge is the connection drawn between two vertices." },
      { id: "c", text: "A node of the graph", feedback: "'Node' is another word for a vertex (a point), not the line between them." },
      { id: "d", text: "A stack of vertices", feedback: "A stack is a data structure, not a part of a graph." },
    ],
    correctOptionId: "b",
  },
  {
    id: "r-A1-2",
    bank: "recheck",
    requires: ["A1"],
    mastery: "remember",
    prompt: "What is the difference between a directed and an undirected edge?",
    options: [
      { id: "a", text: "A directed edge is one-way (an arrow); an undirected edge goes both ways", feedback: "Correct. The arrow on a directed edge restricts travel to one direction." },
      { id: "b", text: "A directed edge is simply drawn longer on the page", feedback: "Length on the page is irrelevant; direction is about an arrow, not size." },
      { id: "c", text: "An undirected edge joins three vertices at once", feedback: "An edge joins exactly two vertices, directed or not." },
      { id: "d", text: "There is no difference; the terms are identical", feedback: "They differ: a directed edge is traversable one way only." },
    ],
    correctOptionId: "a",
  },
  {
    id: "r-A2-1",
    bank: "recheck",
    requires: ["A2"],
    mastery: "understand",
    prompt:
      "Look at the undirected graph (adjacency list alongside). Which vertices are the neighbours of R?",
    graph: graphA2Recheck,
    adjacencyText: adjacencyListText(graphA2Recheck),
    options: [
      { id: "a", text: "S on its own", feedback: "R has three neighbours (P, Q and S), not just S." },
      { id: "b", text: "P and Q only", feedback: "You missed S — the edge R–S makes S a neighbour of R too." },
      { id: "c", text: "P, Q and S", feedback: "Correct. R is joined by edges to P, Q and S." },
      { id: "d", text: "Q and S only", feedback: "You missed P — the edge P–R makes P a neighbour of R too." },
    ],
    correctOptionId: "c",
  },
  {
    id: "r-A2-2",
    bank: "recheck",
    requires: ["A2"],
    mastery: "understand",
    prompt:
      "In the same undirected graph (adjacency list alongside), how many neighbours does vertex S have?",
    graph: graphA2Recheck,
    adjacencyText: adjacencyListText(graphA2Recheck),
    options: [
      { id: "a", text: "One neighbour", feedback: "Correct. S has a single edge (S–R), so one neighbour." },
      { id: "b", text: "Two neighbours", feedback: "S has only the one edge to R; count the edges touching S." },
      { id: "c", text: "Three neighbours", feedback: "Only R touches S; the others connect elsewhere." },
      { id: "d", text: "Zero neighbours", feedback: "S is connected — it has the edge S–R." },
    ],
    correctOptionId: "a",
  },
  {
    id: "r-A3-1",
    bank: "recheck",
    requires: ["A3"],
    mastery: "understand",
    prompt:
      "You enqueue the letters D, then E, then F into an empty queue. If you dequeue twice, which two letters come out, and in what order?",
    options: [
      { id: "a", text: "F then E, newest first", feedback: "That is STACK (LIFO) order. A queue removes the OLDEST items first." },
      { id: "b", text: "D then E, oldest first", feedback: "Correct. FIFO removes D first (oldest), then E." },
      { id: "c", text: "E then D, middle first", feedback: "A queue starts at the front (D), not the middle." },
      { id: "d", text: "F then D, ends first", feedback: "A queue does not jump between ends; it removes from the front in order." },
    ],
    correctOptionId: "b",
  },
  {
    id: "r-A3-2",
    bank: "recheck",
    requires: ["A3"],
    mastery: "understand",
    prompt:
      "A queue holds [7, 8] (7 at the front). You enqueue 9, then dequeue once. What does the queue hold now (front first)?",
    options: [
      { id: "a", text: "[9, 8]", feedback: "9 joins the BACK, and the dequeue removes the FRONT (7), not 7's neighbour." },
      { id: "b", text: "[7, 8]", feedback: "You added 9 and removed a front item, so the contents must change." },
      { id: "c", text: "[8, 7, 9]", feedback: "A queue keeps insertion order; 7 and 8 do not swap." },
      { id: "d", text: "[8, 9]", feedback: "Correct. Enqueue 9 -> [7,8,9]; dequeue removes front 7 -> [8,9]." },
    ],
    correctOptionId: "d",
  },
  {
    id: "r-A4-1",
    bank: "recheck",
    requires: ["A3", "A4"],
    mastery: "understand",
    prompt:
      "The start vertex is already in the queue (use the graph alongside). Which sequence correctly describes ONE round of the BFS procedure, using the queue the right way (take from the front, add at the back) and marking on discovery?",
    graph: graphA4Recheck,
    adjacencyText: adjacencyListText(graphA4Recheck),
    options: [
      { id: "a", text: "Enqueue a vertex at the back, then immediately dequeue it from the back", feedback: "That removes from the wrong end and processes nothing; a queue takes from the FRONT." },
      { id: "b", text: "Visit every vertex at once, then build the queue afterwards", feedback: "BFS is one-at-a-time; the queue drives the order, it is not built at the end." },
      { id: "c", text: "Dequeue the front vertex, visit it, then enqueue its undiscovered neighbours at the back (marking them)", feedback: "Correct. Take from the front, visit, then enqueue new neighbours at the back, marking them on discovery." },
      { id: "d", text: "Dequeue the front vertex and enqueue only neighbours already visited", feedback: "Re-enqueuing visited vertices causes loops; BFS enqueues the UNvisited ones." },
    ],
    correctOptionId: "c",
  },
  {
    id: "r-A4-2",
    bank: "recheck",
    requires: ["A3", "A4"],
    mastery: "understand",
    prompt:
      "In the BFS procedure, what role does the FIFO queue play compared with the 'visited' set? (Both are used while tracing the graph alongside.)",
    graph: graphA4Recheck,
    adjacencyText: adjacencyListText(graphA4Recheck),
    options: [
      { id: "a", text: "The queue and the visited set always hold exactly the same vertices", feedback: "They differ: a vertex is marked visited on discovery but may still be waiting in the queue." },
      { id: "b", text: "The queue holds vertices waiting to be processed; the visited set records those already discovered", feedback: "Correct. The queue orders the waiting work; the visited set stops a vertex being enqueued twice." },
      { id: "c", text: "The visited set fixes the processing order and the queue is unused", feedback: "The ORDER comes from the FIFO queue, not from the visited set." },
      { id: "d", text: "The queue stores edges while the visited set stores vertices", feedback: "The queue stores VERTICES waiting to be processed, not edges." },
    ],
    correctOptionId: "b",
  },
  {
    id: "r-A5-1",
    bank: "recheck",
    requires: ["A2", "A5"],
    mastery: "apply",
    prompt:
      "Trace BFS on the undirected graph starting at P. Follow this exact recipe: enqueue the start; repeatedly take the vertex at the FRONT of the queue, then add each of its not-yet-seen neighbours to the BACK of the queue; when a vertex has several new neighbours, add them in alphabetical order. What is the visit order?",
    graph: graphA5Recheck1,
    adjacencyText: adjacencyListText(graphA5Recheck1),
    options: [
      { id: "a", text: "P, Q, R, S, T", feedback: "Correct. Queue [Q,R]; take Q (add S) -> [R,S]; take R; take S (add T); take T." },
      { id: "b", text: "P, R, Q, T, S", feedback: "Alphabetical tie-break adds Q before R, so Q is visited before R." },
      { id: "c", text: "P, Q, S, R, T", feedback: "This dives from Q to its child S before P's other neighbour R — depth-first, not BFS." },
      { id: "d", text: "P, S, Q, R, T", feedback: "S is not a neighbour of P, so it cannot be visited second." },
    ],
    // Queue from P: [Q,R]. Take Q -> enqueue S => [R,S]. Take R (S already queued) => [S]. Take S -> enqueue T => [T]. Take T.
    correctOptionId: "a",
  },
  {
    id: "r-A5-2",
    bank: "recheck",
    requires: ["A2", "A3", "A4", "A5"],
    mastery: "apply",
    prompt:
      "Trace BFS on the undirected graph starting at G. (When a vertex has several new neighbours, take them in alphabetical order.) What is the visit order?",
    graph: graphA5Recheck2,
    adjacencyText: adjacencyListText(graphA5Recheck2),
    options: [
      { id: "a", text: "G, I, H, J", feedback: "Alphabetical tie-break adds H before I, so H is visited before I." },
      { id: "b", text: "G, J, H, I", feedback: "J is not a neighbour of G, so it cannot be visited second." },
      { id: "c", text: "G, H, I, J", feedback: "Correct. Queue [H,I]; take H (add J) -> [I,J]; take I; take J." },
      { id: "d", text: "G, H, J, I", feedback: "This follows H down to its child J before G's other neighbour I — depth-first, not BFS." },
    ],
    // Queue from G: [H,I]. Take H -> enqueue J => [I,J]. Take I. Take J.
    correctOptionId: "c",
  },
  {
    id: "r-A5-3",
    bank: "recheck",
    requires: ["A2", "A3", "A4", "A5"],
    mastery: "apply",
    prompt:
      "Trace BFS on the DIRECTED graph starting at K (follow the arrows). When a vertex has several new out-neighbours, take them in alphabetical order. What is the visit order?",
    graph: graphA5Recheck3,
    adjacencyText: adjacencyListText(graphA5Recheck3),
    options: [
      { id: "a", text: "K, W, L, Z, V", feedback: "Alphabetical tie-break adds L before W, so L is visited before W." },
      { id: "b", text: "K, Z, V, L, W", feedback: "Z is far down the graph; it cannot be visited before K's own out-neighbours." },
      { id: "c", text: "K, L, V, W, Z", feedback: "This follows K->L->V->Z down one path before K's other neighbour W — depth-first, not BFS." },
      { id: "d", text: "K, L, W, V, Z", feedback: "Correct. Queue [L,W]; take L (add V) -> [W,V]; take W; take V (add Z); take Z." },
    ],
    // Queue from K: [L,W]. Take L -> enqueue V => [W,V]. Take W (V already queued) => [V]. Take V -> enqueue Z => [Z]. Take Z.
    correctOptionId: "d",
  },
  {
    id: "r-A6-1",
    bank: "recheck",
    requires: ["A4", "A5", "A6"],
    mastery: "apply",
    prompt:
      "BFS explored level by level finds the path with the FEWEST edges from the start. Trace BFS from S on this undirected graph and use the level at which V is first reached: what is the fewest number of edges on a path from S to V?",
    graph: graphA6Recheck1,
    adjacencyText: adjacencyListText(graphA6Recheck1),
    options: [
      { id: "a", text: "1 edge", feedback: "V is not a neighbour of S, so it cannot be one edge away." },
      { id: "b", text: "2 edges (S–W–V)", feedback: "Correct. BFS reaches V on level 2 via S–W–V; the S–T–U–V route is longer." },
      { id: "c", text: "3 edges (S–T–U–V)", feedback: "That is the LONGER chain; BFS finds the 2-edge route S–W–V first." },
      { id: "d", text: "4 edges", feedback: "No S–V path is that long; the shortest is 2 edges via W." },
    ],
    // BFS from S: level 1 = {T, W}; level 2 reaches V via W. Shortest S->V = 2 edges.
    correctOptionId: "b",
  },
  {
    id: "r-A6-2",
    bank: "recheck",
    requires: ["A4", "A5", "A6"],
    mastery: "apply",
    prompt:
      "Suppose you trace BFS on this graph (which contains the loop S–T–U–V–W–S) but you do NOT mark vertices as visited. What would go wrong?",
    graph: graphA6Recheck1,
    adjacencyText: adjacencyListText(graphA6Recheck1),
    options: [
      { id: "a", text: "Nothing — BFS behaves the same either way", feedback: "Not so: without marking, vertices around the loop are enqueued again and again." },
      { id: "b", text: "BFS would visit all the vertices in reverse order", feedback: "Marking does not reverse order; omitting it causes re-enqueues, not reversal." },
      { id: "c", text: "The same vertices are enqueued again and again, so BFS may never finish", feedback: "Correct. With no visited check, the cycle re-enqueues seen vertices forever." },
      { id: "d", text: "The graph would silently lose some of its edges", feedback: "BFS never edits the graph; the problem is endless re-enqueuing." },
    ],
    correctOptionId: "c",
  },
];
