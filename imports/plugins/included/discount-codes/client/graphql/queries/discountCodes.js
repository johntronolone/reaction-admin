import gql from "graphql-tag";
import discountCodeFragment from "../Fragments/DiscountCodeCommon";

export default gql`
  query discountCodesQuery($shopId: ID!, $filters: DiscountCodeFilterInput, $firstProducts: ConnectionLimitInt) {
    discountCodes(shopId: $shopId, filters: $filters) {
      nodes {
        ...DiscountCodeCommon
      }
      totalCount
    }
    products(shopIds: [$shopId], first: $firstProducts ) {
      nodes {
        _id
        title
      }
    }
  }
  ${discountCodeFragment}
`;
