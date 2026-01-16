import {
  logBuy as logBuyEvent,
  logList as logListEvent,
  logTokensReceived as logTokensReceivedEvent
} from "../generated/NFTMarket/NFTMarket"
import { logBuy, logList, logTokensReceived } from "../generated/schema"

export function handlelogBuy(event: logBuyEvent): void {
  let entity = new logBuy(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.buyer = event.params.buyer
  entity.tokenId = event.params.tokenId
  entity.price = event.params.price

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlelogList(event: logListEvent): void {
  let entity = new logList(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.saler = event.params.saler
  entity.tokenId = event.params.tokenId
  entity.price = event.params.price

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlelogTokensReceived(event: logTokensReceivedEvent): void {
  let entity = new logTokensReceived(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.value = event.params.value
  entity.data = event.params.data

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
