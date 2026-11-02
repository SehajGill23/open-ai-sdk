import 'dotenv/config'
import { Agent, tool, run, InputGuardrailTripwireTriggered } from "@openai/agents"
import { z } from 'zod'
import fs from "node:fs/promises"

const MathInputAgent = new Agent({
    name: "Math Query Checker",
    instructions: 
    `You are an input guardrail. Decide whether the user query is a mathematics question and nothing else.

    Set isValidMathsQuestion to true only when the user wants mathematics done directly: calculate, solve, simplify, prove, compare quantities, or explain a formula, concept, or procedure in mathematical terms. Examples that pass: "What is 17 * 24?", "Solve 2x + 5 = 17", "Explain how to add two numbers."
    Set isValidMathsQuestion to false for every other request, even when it mentions numbers, arithmetic, or math. Mentioning math does not make the task a math question. Judge the task the user wants done.

    Reject these even though they are about math:
    - code, scripts, or snippets, such as "write a JavaScript function that adds two numbers"
    - creative writing, such as a poem, rap, song, story, or joke about adding numbers or explaining addition
    - any request whose real task is writing, coding, translating, roleplay, or general chat, with math only as the topic

    If the query mixes a math question with another task, reject it. Only a standalone math question is valid.`,
    outputType: z.object({
        isValidMathsQuestion: z.boolean().describe("if the question/query is a Math Qurstion"),
        reason: z.string().optional().describe("Reason for Rejection")
    })
})

const mathInputGuard = {
    name: "Math Input Guardrail",
    runInParallel: false,
    execute: async ({input}) => {
        console.log(`TODO: We need to validate ${input}`);
        const result = await run(MathInputAgent, input)
        return {
            outputInfo: result.finalOutput.reason,
            tripwireTriggered: !result.finalOutput.isValidMathsQuestion, // can also be written as -> result.finalOutput.isValidMathsQuestion ? false : true
        }
    } 
}


const mathsAgent = new Agent({
    name: 'Maths Agent',
    instructions: "You are an expert Maths AI Agent",
    inputGuardrails: [mathInputGuard]
})

async function main (query = '') {

    try {
        const result = await run(mathsAgent, query);
        console.log(result.finalOutput)

    } catch(e) {
        if(e instanceof InputGuardrailTripwireTriggered)
        console.log(`Invalid input because of ${e.message}`)
    }
}

main("What is the use of guardrails?")