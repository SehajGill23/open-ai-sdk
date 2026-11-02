import { Agent, run, tool } from '@openai/agents';
import {z} from 'zod';
import 'dotenv/config';
import axios from 'axios';


const getWeatherResultSchema = z.object({
        city: z.string().describe('name of the city'),
        degree_c: z.number().describe('the degree celcius of the temp'),
        condition: z.string().optional().describe( 'The condition of the weather')
    });

//function tool
const getWeather = tool({
  name: 'getWeather',
  description: 'Get the weather information of all the given locations',
  parameters: z.object({
    city: z.string().describe('name of the city')
  }),
  execute: async function({city}) { //this is the actual function that runs, and takes the parameter city that we defined in the aboev object as parameter city.

    //TODO: Replace this with an actual weather api call, we are hardcoding it for learning rn. 
    // return `The weather of ${city} is sunnt with the wind`

    const url = `https://wttr.in/${city.toLowerCase()}?format=%c+%t`
    const respone = await axios.get(url, {responseType: 'text'})
    return `The weather of ${city} is ${respone.data}`
  } 
});

//function tool
const sendEmailTool = tool({
    name:'sendEmail',
    description: 'Send an email about whatever the user wants it to be about.',
    parameters: z.object({
        emailTo: z.string().describe(`Send the email to`),
        subject: z.string().describe(`Email Subject`),
        body: z.string().describe(`body of the email`)
    }),
    execute: async function({emailTo, subject, body}) {

    }
})

const weatherAgent = new Agent({
  name: 'Weather Agent',
  description: 'A agent that tells the weather',
  instructions: 'You are a helpful assistant that tells the weather',
  tools: [getWeather, sendEmailTool],
  model: 'gpt-4o-mini',
  outputType: getWeatherResultSchema // we difine a schema like this, if we want our output to be strcutured. As that way as an example, we can perform CRUD operations with the ouput data, in our database.
});


const main = async (query = '') => {
    if (query) {
        const result = await run(weatherAgent, query)
        console.log(result.finalOutput);
    } else {
        console.log('No query provided');
    }
}

//calling the main function to run the agent.
main('What is the weather of  San Fransico right now?');