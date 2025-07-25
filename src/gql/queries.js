import { gql } from "graphql-request";

export const getHome = gql`
  query getHome {
    home {
      assets {
        id
        format
        alt
        url
        blurUpThumb
        height
        width
        focalPoint {
          x
          y
        }
        video {
          muxPlaybackId
          blurUpThumb
          width
          height
          thumbnailUrl
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