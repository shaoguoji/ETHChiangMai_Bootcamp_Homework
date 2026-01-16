import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  logBuy,
  logList,
  logTokensReceived
} from "../generated/NFTMarket/NFTMarket"

export function createlogBuyEvent(
  buyer: Address,
  tokenId: BigInt,
  price: BigInt
): logBuy {
  let logBuyEvent = changetype<logBuy>(newMockEvent())

  logBuyEvent.parameters = new Array()

  logBuyEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  logBuyEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  logBuyEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )

  return logBuyEvent
}

export function createlogListEvent(
  saler: Address,
  tokenId: BigInt,
  price: BigInt
): logList {
  let logListEvent = changetype<logList>(newMockEvent())

  logListEvent.parameters = new Array()

  logListEvent.parameters.push(
    new ethereum.EventParam("saler", ethereum.Value.fromAddress(saler))
  )
  logListEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  logListEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )

  return logListEvent
}

export function createlogTokensReceivedEvent(
  from: Address,
  value: BigInt,
  data: Bytes
): logTokensReceived {
  let logTokensReceivedEvent = changetype<logTokensReceived>(newMockEvent())

  logTokensReceivedEvent.parameters = new Array()

  logTokensReceivedEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  logTokensReceivedEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )
  logTokensReceivedEvent.parameters.push(
    new ethereum.EventParam("data", ethereum.Value.fromBytes(data))
  )

  return logTokensReceivedEvent
}
