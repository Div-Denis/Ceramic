import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import {Web3Provider} from "@ethersproject/providers"
import Web3Modal from "web3modal"
import { useEffect, useRef, useState } from 'react'
//提供了hook，它为我们提供了一种连接和断开Ceramic网络的简单方法
import { useViewerConnection } from '@self.id/react'
//它是Seklf.ID SDK 导出的一个类，它以以太坊提供者和地址为参数
//并使用它将你的以太坊钱包连接到你的3ID
import { EthereumAuthProvider } from '@self.id/web'

// 另一个hook它允许在Ceramic Network上存储和检索配置文件信息
import { useViewerRecord } from '@self.id/react'

export default function Home() {
 //初始化hook,跟踪连接状态
  const [connection,connect,disconnect] = useViewerConnection()
  const web3ModalRef = useRef();
  
  /**
   *  辅助函数，获取provider
   * 该函数将提示用户连接他们的钱包（前提是还没连接的话）
   * ，然后返回Web3Provider
   */
  const getProvider = async () =>{
    const provider = await web3ModalRef.current.connect();
    const wrappedProvider = new Web3Provider(provider);
    return wrappedProvider;
  };
  
 /**
  * 获取到EthereumAuthProvider
  */
  const connectToSelfID = async () =>{
    const ethereumAuthProvider = await getEthereumAuthProvider();
    connect(ethereumAuthProvider);
  };

  /**
   * 创建出EthereumAuthProvider
   */
 const getEthereumAuthProvider = async () => {
  const wrappedProvider = await getProvider();
  const signer = wrappedProvider.getSigner();
  const address = await signer.getAddress();
  return new EthereumAuthProvider(wrappedProvider.provider,address);
 };

  useEffect(() =>{
    //判断是否连接钱包，
    //条件是检查用户有没有连接到Ceramic
    //如果没有，我们将初始化web3Modal
    if(connection.status !== "connected"){
      web3ModalRef.current = new Web3Modal({
        network:"rinkeby",
        providerOptions:{},
        disableInjectedProvider:false
      });
    }
  },[connection.status]);

  return (
    <div className={styles.main}>
      <div className={styles.navbar}>
        <span className={styles.title}>Ceramic Demo</span>
        {connection.status === "connected" ? (
          <span className={styles.subtitle}>connected</span>
        ) : (
          <button 
             onClick={connectToSelfID}
             className={styles.button}
             disabled = {connection.status === "connecting"}>
              Connect
             </button>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.connection}>
          {connection.status === "connected" ? (
            <div>
              <span className={styles.subtitle}>
                Your 3ID is {connection.selfID.id}
              </span>
              <RecordSetter />
            </div>
          ) : (
            <span className={styles.subtitle}>
              Connect with your wallet to access your 3ID
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RecordSetter(){
  //根据你可以输入它来更新你的记录
  const [name, setName] = useState("");

  //使用userViewRecord hook 
  const record = useViewerRecord("basicProfile")
   
  /**
   * 创建一个辅助函数来更新存储我们记录中的名称（Ceramic上的数据）
   */
   const updateRecordName = async () =>{
    await record.merge({
      name:name,
    })
   };

   return(
    <div className={styles.content}>
      <div className={styles.mt2}>
        {record.content ? (
          <div className={styles.flexCol}>
            <span className={styles.subtitle}>
              Hello {record.content.name}!
            </span>

            <span>
              The above name was loaded from Ceramic Network.try updating below.
            </span>
          </div>
        ):(
          <span>
            You do not have a profile record attached to your 3ID. Create
            basic profile by setting a name below
          </span>
        )}
      </div>

      <input 
         type='text'
         placeholder='Name'
         value={name}
         onChange={(e) => setName(e.target.value)}
         className={styles.mt2}
         />
         <button onClick={() => updateRecordName(name)}>Update</button>
    </div>
   );
}
