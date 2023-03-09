import { License } from "./license";
import { Videobuildrequest } from "./videobuildrequest";

export interface Paymentintentrequest extends Videobuildrequest {
    license: License,
    cost: number
}
