// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("TEST", "TEST01"){

    }
    function mint(address to, uint amount) external {
        _mint(to, amount);
    }
}
