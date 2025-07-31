import { gql } from "graphql-request";

export const getHome = gql`
  query getHome {
    home {
      assets {
        ... on PhotoRecord {
          id
          _modelApiKey
          photo {
            id
            format
            alt
            url
            blurUpThumb
            height
            width
          }
        }
        ... on VideoRecord {
          id
          _modelApiKey
          thumbnail {
            id
            format
            alt
            url
            blurUpThumb
            height
            width
          }
          video {
            id
            format
            alt
            url
            blurUpThumb
            width
            height
          }
        }
      }
    }
  }
`;

export const getInfo = gql`
  query getInfo {
    info {
      clients {
        id
        listItem
      }
      services {
        id
        listItem
      }
    }
  }
`;