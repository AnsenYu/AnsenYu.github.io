
    initIronman(cb);
    function initIronman(callback) {
    document.addEventListener('ironmanLoaded', ironmanExtension => {
        console.log('extension load');
        $('#j_submit').length && $('#j_submit').prop('disabled', false);

        const ironman = window.ironman;
        //防止别的网页应用 调用window.ironman 对象
        // window.ironman = null;
        // If you want to require a specific version of Scatter
        ironman.requireVersion(1.2);
        const foNetwork = {
            name: 'FIBOS Mainnet',
            protocol: 'http',
            port: 80,
            host: 'api.fibos.rocks',
            blockchain: 'fibos',
            chainId: '6aa7bd33b6b45192465afa3553dedb531acaaff8928cf64b70bd4c5e49b7ec6a'
        }

        const RequirefoNetwork = {
            blockchain: 'fibos',
            chainId: '6aa7bd33b6b45192465afa3553dedb531acaaff8928cf64b70bd4c5e49b7ec6a'
        }

        //给用户推荐网络， 第一次需要授权
        //ironman.suggestNetwork(foNetwork);
        // ironman.getIdentity 用户授权页面
        ironman.getIdentity({
            accounts: [RequirefoNetwork]
        }).then(
            identity => {
              console.log('get identity');

                const account = identity.accounts.find(acc => acc.blockchain === 'fibos');
                // FO参数
                const foOptions = {
                    broadcast : true,
                    chainId:"6aa7bd33b6b45192465afa3553dedb531acaaff8928cf64b70bd4c5e49b7ec6a"
                }
                //获取FO instance
                const fo = ironman.fibos(foNetwork, Fo, foOptions, "http");
                const requiredFields = {
                    accounts: [foNetwork]
                };
                callback(ironman, fo, requiredFields, account);
            }).catch(
            e => {
                console.log("error", e);
            }
        );
    })
    }
 

    function cb(ironman, fo, requiredFields, account) {
      if ($('#vote_with_ironman').attr("onclick")) {
        $('#vote_with_ironman').removeAttr("onclick");
      }
      $('#vote_with_ironman').on('click', function (event) {
        event.preventDefault();
        let vote_info = $('#vote_with_ironman').text()
        $('#vote_with_ironman').prop('disabled', true).text('加载中...');
        setTimeout(function () {
          $('#vote_with_ironman').prop('disabled', false).text(vote_info);
        }, 5000);
        // const bp2vote = "ansenironman"
        const encodedName = new BigNumber(
          Fo.modules.format.encodeName(account.name, false))
        fo.getTableRows({
          json: true,
          code: "eosio",
          scope: "eosio",
          table: "voters",
          lower_bound: encodedName.toString(),
          upper_bound: encodedName.plus(1).toString()
        }).then( table => {
          if (table && table.rows && table.rows[0] && table.rows[0].producers) {
            let producers = table.rows[0].producers
            if (producers.indexOf(bp2vote) == -1) {
              if (producers.length >= 30) {
                console.log("您的投票次数已经超过30次，请移除后再投票，谢谢");
                alert("您的投票次数已经超过30次，请移除后再投票，谢谢");
              } else {
              producers.push(bp2vote);
              producers.sort();

                //执行智能合约
                fo.contract('eosio', {
                  requiredFields
                }).then(contract => {
                  contract.voteproducer(account.name, "", producers).then(
                    trx => {
                    let url = `http://explorer.fibos.rocks/transactions/${trx.transaction_id}`;
                    alert(`投票成功，谢谢支持`)
                  }).catch(e => {
                    console.log("error", e);
                    if (e.toString().includes("overdrawn balance")) {
                      alert("No money, go back to Getting Started and refill")
                    }
                    let error = JSON.parse(e);
                    alert(error.message || 'Server Error');
                  })
                });
              }
            } else {
              console.log(`已经给${bp2vote}投过票了`);
              alert(`已经给${bp2vote}投过票了，无需重复投票，谢谢支持`)
            }
          }
        });

      });
    }
