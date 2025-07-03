import { GraphQLClient } from "graphql-request";

export async function getPropData(query) {

  const client = new GraphQLClient(process.env.DATO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${process.env.DATO_API_KEY}`,
    },
  });

  const data = await client.request(query);

  return data;

}