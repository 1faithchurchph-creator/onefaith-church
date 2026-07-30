import React from 'react'
import logo from '../assets/image2.png'
import '../css/home.css'

const Tagline = () => {
    return (
        <section className="home-tagline">
            <div className="home-tagline__image">
                <img src={logo} alt="One Faith Church logo" />
            </div>

            <div className="home-tagline__text">
                <h1>Welcome to One Faith Church in Christ Philippines</h1>
                <p>
                    Come experience the faith and love of Jesus and the resurrection power of the Holy Spirit.
                </p>
            </div>
        </section>
    )
}

const Home = () => {
    return (
        <main className="home-page">
            <Tagline />
        </main>
    )
}

export default Home
