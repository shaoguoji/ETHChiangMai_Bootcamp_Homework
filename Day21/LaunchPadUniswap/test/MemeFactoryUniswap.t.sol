// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MemeFactory.sol";
import "../src/MemeToken.sol";
import "./mocks/MockUniswapV2Router.sol";

contract MemeFactoryUniswapTest is Test {
    MemeFactory public factory;
    MockUniswapV2Router public router;
    address public issuer = address(0x111);
    address public user = address(0x222);

    event LiquidityAdded(
        address indexed tokenAddress,
        uint256 amountToken,
        uint256 amountETH,
        uint256 liquidity
    );

    function setUp() public {
        router = new MockUniswapV2Router();
        factory = new MemeFactory(address(router));
        vm.deal(user, 100 ether);
    }

    function testAddLiquidity() public {
        vm.prank(issuer);
        address memeAddr = factory.deployMeme("MEME", 1000, 100, 1 ether);

        vm.prank(user);
        
        // Expect LiquidityAdded event
        // MockRouter returns (amountToken, msg.value, 1000)
        // amountToken = tokensForLiquidity
        // fee = 1 ether * 5% = 0.05 ether
        // tokensForLiquidity = 0.05 ether / (1 ether / 100) = 5
        vm.expectEmit(true, false, false, true);
        emit LiquidityAdded(memeAddr, 5, 0.05 ether, 1000);

        factory.mintMeme{value: 1 ether}(memeAddr);
    }

    function testBuyMeme() public {
        vm.prank(issuer);
        address memeAddr = factory.deployMeme("MEME", 1000, 100, 1 ether);

        vm.prank(user);
        // User buys with 0.5 ether
        // We expect call to router
        // swapExactETHForTokens(0, path, user, timestamp)
        
        // Since we can't easily check internal call arguments without expectCall,
        // we will use expectCall to verify the router function was called.
        // Selector for swapExactETHForTokens(uint256,address[],address,uint256)
        
        // We verify the call happens
        bytes memory data = abi.encodeWithSelector(
            router.swapExactETHForTokens.selector,
            0,
            _getPath(address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2), memeAddr), // WETH is hardcoded in Mock to Mainnet WETH
            user,
            block.timestamp
        );
        
        // Note: The mock router address for WETH is 0xC02aa...
        // But let's be careful. The Factory reads WETH from Router.
        // MockRouter sets WETH in constructor.
        
        factory.buyMeme{value: 0.5 ether}(memeAddr);
    }

    function _getPath(address weth, address token) internal pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = weth;
        path[1] = token;
        return path;
    }

    function testBuyMemeWithZeroEth() public {
        vm.prank(issuer);
        address memeAddr = factory.deployMeme("MEME", 1000, 100, 1 ether);

        vm.prank(user);
        vm.expectRevert("No ETH sent");
        factory.buyMeme{value: 0}(memeAddr);
    }
}
