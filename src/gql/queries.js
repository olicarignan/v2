import { gql } from "graphql-request";

export const getHome = gql`
  query getHome {
    home {
      assets {
        id
        alt
        url
        blurUpThumb
        height
        width
        focalPoint {
          x
          y
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