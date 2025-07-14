import { GraphQLClient } from "graphql-request";

export async function getPropData(query) {

  const client = new GraphQLClient(process.env.NEXT_PUBLIC_DATO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_DATO_API_KEY}`,
    },
  });

  const data = await client.request(query);

  return data;

}

export const graphqlClient = new GraphQLClient(
  process.env.NEXT_PUBLIC_DATO_ENDPOINT,
  {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_DATO_API_KEY}`,
    },
  }
);

export const fetcher = (query, variables) => {
  return graphqlClient.request(query, variables);
};